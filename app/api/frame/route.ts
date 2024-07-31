'use client';

import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { validateFramesMessage } from "@airstack/frames";
import { init } from "@airstack/frames";
import {BUTTON_TO_DAYS, filterIndexerFrame, initialFilteredFrame, initialFrame} from "@/app/frames";
import buildImage from "@/app/lib/generateChartImage";
import {parseState, parseStateFromUntrusted, parseText} from "@/app/utils";
import {DEFAULT_DAYS} from "@/app/const";

let validateFrames = false;

if (process.env.AIRSTACK_API_KEY) {
  init(process.env.AIRSTACK_API_KEY);
  validateFrames = true;
}

function sendError(message: string) {
  return NextResponse.json({message: message}, {status: 400});
}

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const searchParams = req.nextUrl.searchParams
  const indexer = searchParams.get("indexer");

  const body: FrameRequest = await req.json();

  let button, state, inputText;
  if (validateFrames) {
    const response = await validateFramesMessage(body);
    const isValid = response.isValid

    if (!isValid || !response.message)
      return sendError("Invalid frame message");

    const frameActionBody = response.message.data.frameActionBody;

    button = frameActionBody.buttonIndex;
    state = parseState(frameActionBody.state)
    inputText = parseText(frameActionBody.inputText);
  } else {
    button = body.untrustedData.buttonIndex;
    state = parseStateFromUntrusted(body.untrustedData.state);
    inputText = body.untrustedData.inputText;
  }
  const days = state.days ?? DEFAULT_DAYS;
  try {
    if (state.selectIndexer) {  // we are in the select indexer frame
      if (button === 1) {
        const newIndexer = inputText;
        if (!newIndexer) {
          return sendError("Indexer cannot be empty");
        }
        const dataImage = await buildImage(days, newIndexer);
        return new NextResponse(getFrameHtmlResponse(initialFilteredFrame(dataImage, newIndexer, days)));
      }
      const dataImage = await buildImage(days);
      return new NextResponse(getFrameHtmlResponse(initialFrame(dataImage, days)));
    } else {  // we are either in the Filter or Unfiltered chart frame
      if (button === 4) {
        if (indexer) {  // filtered frame
          const dataImage = await buildImage(days);
          return new NextResponse(getFrameHtmlResponse(initialFrame(dataImage, days)));
        } else {  // unfiltered frame
          return new NextResponse(getFrameHtmlResponse(filterIndexerFrame(days)));
        }
      }

      const newDays = BUTTON_TO_DAYS[`button_${button as 1|2|3}`];

      const dataImage = await buildImage(newDays, indexer);

      if (indexer) {  // filtered frame
        return new NextResponse(getFrameHtmlResponse(initialFilteredFrame(dataImage, indexer, newDays)));
      }
      // unfiltered frame
      return new NextResponse(getFrameHtmlResponse(initialFrame(dataImage, newDays)));
    }
  } catch (e) {
    console.error(e);
    return sendError("Internal Server Error");
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';