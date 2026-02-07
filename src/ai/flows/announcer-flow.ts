
'use server';

/**
 * @fileOverview AI Stadium Announcer flow.
 * 
 * - announcerVoice - A function that converts game situation text into a stadium announcement audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const AnnouncerInputSchema = z.object({
  situation: z.string().describe('The current football situation, e.g., "3rd and 5 at the 40".'),
  lastResult: z.string().optional().describe('Description of what just happened on the last play.')
});

export type AnnouncerInput = z.infer<typeof AnnouncerInputSchema>;

export async function announcerVoice(input: AnnouncerInput) {
  return announcerFlow(input);
}

const announcerFlow = ai.defineFlow(
  {
    name: 'announcerFlow',
    inputSchema: AnnouncerInputSchema,
    outputSchema: z.object({
      audioData: z.string().describe('Base64 encoded WAV audio data URI.')
    }),
  },
  async (input) => {
    const prompt = input.lastResult 
      ? `Stadium announcer: "${input.lastResult}. Now, it is ${input.situation}!"`
      : `Stadium announcer: "Welcome fans. It is currently ${input.situation}!"`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt,
    });

    if (!media) {
      throw new Error('No audio media returned from Gemini TTS');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    return {
      audioData: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
