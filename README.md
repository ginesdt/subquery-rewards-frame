# SubQuery Rewards Farcaster Frame

This is a [Farcaster Frame](https://docs.farcaster.xyz/developers/frames/) for visualizing rewards stats on the SubQuery network.

## Development guide

This is a [Next.js](https://nextjs.org/) project.

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The entry page is in `app/page.tsx`.

The different frames handler for regular buttons are in `app/api/frame/route.ts`.

The logic to generate charts images to show in the frame is in `app/lib/generateChartImage.ts`

