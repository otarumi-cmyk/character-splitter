const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

interface InstagramConfig {
  accessToken: string;
  instagramAccountId: string;
}

export async function publishSingleImage(
  config: InstagramConfig,
  imageUrl: string,
  caption: string
): Promise<string> {
  // Step 1: Create media container
  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${config.instagramAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: config.accessToken,
      }),
    }
  );
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // Step 2: Publish
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${config.instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: config.accessToken,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);

  return published.id;
}

export async function publishCarousel(
  config: InstagramConfig,
  imageUrls: string[],
  caption: string
): Promise<string> {
  // Step 1: Create individual media containers for each image
  const childIds: string[] = [];
  for (const imageUrl of imageUrls) {
    const res = await fetch(
      `${GRAPH_API_BASE}/${config.instagramAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: config.accessToken,
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    childIds.push(data.id);
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(
    `${GRAPH_API_BASE}/${config.instagramAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption,
        access_token: config.accessToken,
      }),
    }
  );
  const carousel = await carouselRes.json();
  if (carousel.error) throw new Error(carousel.error.message);

  // Step 3: Publish
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${config.instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: config.accessToken,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);

  return published.id;
}

export async function getAccountInfo(config: InstagramConfig) {
  const res = await fetch(
    `${GRAPH_API_BASE}/${config.instagramAccountId}?fields=username,name,profile_picture_url,followers_count,media_count&access_token=${config.accessToken}`
  );
  return res.json();
}
