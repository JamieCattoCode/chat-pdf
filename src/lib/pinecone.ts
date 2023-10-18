import { Pinecone, utils as PineconeUtils, PineconeRecord } from '@pinecone-database/pinecone';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';
import md5 from 'md5';

import { downloadFromS3 } from './s3-server';
import { removeWhiteSpace } from '@/utilities';
import { getEmbeddings } from './embeddings';
import { convertToAscii } from './utils';

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            environment: process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!
        });
    }

    return pinecone;
};

type PDFPage = {
    pageContent: string,
    metadata: {
        loc: { pageNumber: number }
    }
};

// Turn the PDF into documents
export async function loadS3IntoPinecone(fileKey: string) {
    // 1: Obtain the pdf -> download and read from the pdf 
    console.log('Downloading s3 into file system...');
    const fileName = await downloadFromS3(fileKey);

    if (!fileName) {
        throw new Error('Could not download from S3.');
    }

    const loader = new PDFLoader(fileName);
    const pages = (await loader.load()) as PDFPage[];

    // 2: Load the pdf into pineconeDB
    const documents = await Promise.all(pages.map(prepareDocument));
    
    // 3: Vectorise and embed the individual documents
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    type VectorMetadata = {
        text: string,
        pageNumber: number
    }

    // 4: Upload to pinecone
    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.index('chat-pdf');

    console.log('Inserting vectors into pinecone...');
    const namespace = convertToAscii(fileKey);

    // console.log('Vectors: ', vectors);x
    await pineconeIndex.upsert(vectors);

    // PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10);
    return documents[0];
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as PineconeRecord;
    } catch (error) {
        console.log('Error embedding documents... ', error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const encoder = new TextEncoder();
    return new TextDecoder('utf-8').decode(encoder.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;

    pageContent = removeWhiteSpace(pageContent);

    const docs = await splitDocuments(pageContent, metadata);

    return docs;
}

async function splitDocuments(pageContent: string, metadata: {loc: { pageNumber: number }}) {
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent: pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }}
        )
    ]);

    return docs;
}