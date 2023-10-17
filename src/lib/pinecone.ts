import { PineconeClient } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';

let pinecone: PineconeClient | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new PineconeClient();

        await pinecone.init({
            environment: process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!
        })
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

function removeWhiteSpace(str: string) {
    return str.replace(/\n/g, '');
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