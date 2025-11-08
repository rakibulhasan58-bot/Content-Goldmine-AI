
import { GoogleGenAI, Type, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonFromResponse = (text: string) => {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return JSON.parse(jsonText);
};


const ideaGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'A single content idea title.'
            },
            description: 'An array of 5 to 10 content ideas.'
        }
    },
    required: ['ideas']
};

export const generateContentIdeas = async (topic: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 7 engaging and diverse content ideas (like blog titles or social media posts) about "${topic}". Include a mix of how-to guides, listicles, comparisons, and question-based ideas.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: ideaGenerationSchema,
                temperature: 0.8,
            },
        });

        const result = parseJsonFromResponse(response.text);

        if (result && Array.isArray(result.ideas)) {
            return result.ideas;
        } else {
            console.error("Unexpected JSON structure:", result);
            throw new Error("Failed to parse content ideas from API response.");
        }
    } catch (error) {
        console.error("Error generating content ideas:", error);
        throw new Error("Could not connect to the AI service.");
    }
};

const expandedIdeaSchema = {
    type: Type.OBJECT,
    properties: {
        outline: {
            type: Type.STRING,
            description: 'A detailed blog post outline in Markdown format.'
        },
        summary: {
            type: Type.STRING,
            description: 'A short, engaging summary of the content idea, under 250 characters, suitable for social media.'
        }
    },
    required: ['outline', 'summary']
};


export const expandContentIdea = async (title: string): Promise<{ outline: string; summary: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a detailed outline and a social media summary for a blog post titled "${title}". The outline should be in markdown format. Include a compelling introduction, 3-5 main sections with bullet points for key topics in each, and a concluding summary. The social media summary should be short, engaging, and under 250 characters. Respond with a single JSON object containing two keys: "outline" and "summary".`,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json",
                responseSchema: expandedIdeaSchema,
            },
        });

        const result = parseJsonFromResponse(response.text);

        if (result && result.outline && result.summary) {
            return result;
        } else {
             console.error("Unexpected JSON structure for expanded idea:", result);
            throw new Error("Failed to parse expanded idea from API response.");
        }
    } catch (error) {
        console.error("Error expanding content idea:", error);
        throw new Error("Could not connect to the AI service to expand the idea.");
    }
};

const fullContentSchema = {
    type: Type.OBJECT,
    properties: {
        fullContent: {
            type: Type.STRING,
            description: 'The full blog post content in Markdown format.'
        }
    },
    required: ['fullContent']
};

export const generateFullContent = async (title: string, outline: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are an expert content writer. Write a comprehensive, engaging, and well-structured blog post based on the following title and outline. The tone should be informative and authoritative. Use Markdown for formatting, including headers, lists, and bold text where appropriate.\n\n**Title:** ${title}\n\n**Outline:**\n${outline}\n\nGenerate only the full blog post content.`,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json",
                responseSchema: fullContentSchema,
            },
        });
        
        const result = parseJsonFromResponse(response.text);

        if (result && result.fullContent) {
            return result.fullContent;
        } else {
            console.error("Unexpected JSON structure for full content:", result);
            throw new Error("Failed to parse full content from API response.");
        }
    } catch (error) {
        console.error("Error generating full content:", error);
        throw new Error("Could not connect to the AI service to generate the full content.");
    }
};

export const generateContentImage = async (title: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `Generate a high-quality, visually appealing cover image for a blog post titled "${title}". The image should be professional, in a 16:9 aspect ratio, and relevant to the topic.`,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                // The API returns raw base64, so we create a data URI
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("No image was generated by the API.");
    } catch (error) {
        console.error("Error generating content image:", error);
        throw new Error("Could not connect to the AI service to generate an image.");
    }
};

export const generateContentVideo = async (title: string, fullContent: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set. Please select a key.");
    }
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Create a short, engaging 15-second video summary for a blog post titled "${title}". The video should be visually appealing and represent the key themes of the article. Focus on these concepts: ${fullContent.substring(0, 500)}...`;

    try {
        let operation = await localAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was provided.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            console.error("Failed to download video:", errorText);
            if (videoResponse.status === 404) {
                 throw new Error("Your API key is invalid. Please select a valid key and try again.");
            }
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating content video:", error);
        if (error instanceof Error && (error.message.includes("Requested entity was not found.") || error.message.includes("Your API key is invalid"))) {
             throw new Error("Your API key is invalid. Please select a valid key and try again.");
        }
        throw new Error("Could not connect to the AI service to generate a video.");
    }
};
