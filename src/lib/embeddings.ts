import { removeWhiteSpace } from '@/utilities';
import { OpenAIApi, Configuration } from 'openai-edge';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});

const openAi = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
    try {
        const response = await openAi.createEmbedding({
            model: 'text-embedding-ada-002',
            input: removeWhiteSpace(text)
        });

        const result = await response.json();
        const { data } = result;
        
        return data[0].embedding;
    } catch (error) {
        console.log('Error calling OpenAI API... ', error);
        throw error;
    }
}