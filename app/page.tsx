import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import type { Metadata } from 'next';
import buildImage from '@/app/lib/generateChartImage';
import {initialFrame} from "@/app/frames";
import {DEFAULT_DAYS} from "@/app/const";

const title = 'Subquery Rewards Frame';
const description = 'Farcaster Frame to show Subquery indexer rewards';

export async function generateMetadata(): Promise<Metadata> {

  const imageData = await buildImage(DEFAULT_DAYS);

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL),
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [imageData],
    },
    other: {
      ...getFrameMetadata(initialFrame(imageData)),
    },
  }
}

export default function Page() {
  return (
    <>
      <h1>Subquery Rewards Farcaster Frame</h1>
    </>
  );
}
