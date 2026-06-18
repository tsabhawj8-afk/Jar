
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData } from "../types";

export const generateStoryboard = async (
  prompt: string,
  mood: string = "nostalgic",
  tempo: string = "medium",
  vibe: string = "pop"
): Promise<StoryboardData> => {
  // Using process.env.GEMINI_API_KEY as the primary key source, with process.env.API_KEY as custom fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("Gemini API key is not configured. Please add your GEMINI_API_KEY inside the Settings > Secrets/Secrets panel.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  
  const systemInstruction = `You are a professional Hmong songwriter and music video storyboard director. 
You write beautiful, poetic Hmong lyrics that follow Hmong cultural stories, rhyming patterns, and emotional beats. 
You translate lyrics line-by-line into English. 
You also format a complete 5-to-6 scene storyboard for the music video with high-concept visual directions, production notes, and emotional mood levels.`;

  const userPrompt = `Develop a Hmong song and MV storyboard.
User prompt topic: "${prompt}"
Song properties:
- Mood style: ${mood} (tu siab / zoo siab / hlub / nco)
- Rhythm/Tempo: ${tempo} (qeeb / nruab nrab / ceev)
- Aesthetic vibe: ${vibe} (traditional / pop / modern hiphop)

Generate:
1. Poetic Hmong song title (proper tonal Roman Popular Alphabet spelling like 'Nco Koj Hmo Ob Hlis') and an English translation.
2. A singer pseudonym (famous Hmong style).
3. Sound/Production style theme notes describing instruments (e.g., traditional raj flute, acoustic guitar, modern pop bass).
4. Full song lyrics divided into at least 4 sections (e.g. Verse 1 / Nqe 1, Verse 2 / Nqe 2, Chorus / Nqe Tshooj, Bridge / Choj, Outro / Nqe Xaus).
   - Each section must have exactly 4 to 6 lines.
   - Each line must contain 'text' (poetic, deep Hmong lyrics following proper rhyme scheme) and 'translation' (meaningful, poetic English translation).
5. Exactly 5 or 6 storyboard scenes mapping the video sequence. Each scene must include:
   - "time": timestamp (e.g., "0:00 - 0:25", "1:15 - 1:45")
   - "description": deep visual storyboard scene description in English.
   - "hmongDescription": summary visual card in Hmong.
   - "visualCue": editing style, camera angles (e.g., close-up, panning, drone shot) or lighting cues.
   - "mood": score 0 to 100 for emotional intensity.
   - "unsplashQuery": a 2-3 word keyword search query for finding beautiful landscape/visual matching images on Unsplash (e.g., 'foggy mountains', 'traditional campfire', 'rainy window close up', 'stage lighting guitar'). Ensure no punctuation, just nouns.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          hmongTitle: { type: Type.STRING },
          artist: { type: Type.STRING },
          theme: { type: Type.STRING },
          overallMood: { type: Type.STRING },
          traditionalDetails: { type: Type.STRING, description: "Cultural details or instrument selections for the backing track" },
          lyrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sectionName: { type: Type.STRING, description: "e.g., Verse 1, Chorus, Outro" },
                hmongSectionName: { type: Type.STRING, description: "e.g., Nqe 1, Nqe Tshooj, Choj" },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING, description: "Hmong lyrics" },
                      translation: { type: Type.STRING, description: "English translated line" }
                    },
                    required: ["text", "translation"]
                  }
                }
              },
              required: ["sectionName", "hmongSectionName", "lines"]
            }
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                description: { type: Type.STRING },
                hmongDescription: { type: Type.STRING },
                visualCue: { type: Type.STRING },
                mood: { type: Type.NUMBER },
                unsplashQuery: { type: Type.STRING }
              },
              required: ["time", "description", "hmongDescription", "visualCue", "mood", "unsplashQuery"]
            }
          }
        },
        required: ["title", "hmongTitle", "artist", "theme", "scenes", "overallMood", "lyrics"]
      }
    }
  });

  const rawData = JSON.parse(response.text || "{}");

  // Map the scenes to high quality static Unsplash photos
  const scenesWithImages = (rawData.scenes || []).map((scene: any, index: number) => {
    const defaultQueries = [
      "laos,mountains,mist",
      "traditional,hmong",
      "campfire,night",
      "rain,window,forest",
      "acoustic,guitar,retro",
      "sunset,lake,sad"
    ];
    
    // Clean query
    const rawQuery = scene.unsplashQuery || defaultQueries[index % defaultQueries.length];
    const cleanQuery = encodeURIComponent(rawQuery.replace(/[^a-zA-Z0-9\s,]/g, '').trim());
    
    // Construct a beautiful stable featured photo URL
    const imageUrl = `https://images.unsplash.com/featured/800x450/?${cleanQuery || "mountains,nature"}&sig=${index}-${Date.now().toString().slice(-4)}`;

    return {
      ...scene,
      imageUrl
    };
  });

  return {
    ...rawData,
    scenes: scenesWithImages
  };
};

