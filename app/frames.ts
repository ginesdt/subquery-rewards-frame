import {FrameMetadataType} from "@coinbase/onchainkit/esm/frame";

export const BUTTON_TO_DAYS = {
  button_1: 30,
  button_2: 7,
  button_3: 1
}

export function initialFrame(imageData: string, days?: number) : FrameMetadataType {
  return {
    buttons: [
      {
        label: '30 Days',
      },
      {
        label: '7 Days',
      },
      {
        label: '24 Hours',
      },
      {
        label: 'Filter',
      }
    ],
    image: {
      src: imageData,
      aspectRatio: "1:1"
    },
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame`,
    state: {days: days},
  }
}

export function filterIndexerFrame(days: number) : FrameMetadataType {
  return {
    input: {
      text: "Indexer address"
    },
    buttons: [
      {
        label: 'Filter',
      },
      {
        label: '< Go Back',
      }
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_URL}/subquery.png`,
      aspectRatio: "1:1"
    },
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame`,
    state: {selectIndexer: true, days: days}
  }
}

export function initialFilteredFrame(imageData: string, indexer: string, days: number) : FrameMetadataType {
  return {
    buttons: [
      {
        label: '30 Days',
      },
      {
        label: '7 Days',
      },
      {
        label: '24 Hours',
      },
      {
        label: 'Clear filter',
      }
    ],
    image: {
      src: imageData,
      aspectRatio: "1:1"
    },
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?indexer=${indexer}`,
    state: {days: days}
  }
}

