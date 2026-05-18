import type { Metadata } from "next";

type SearchParams = Record<string, string | string[] | undefined>;

type GetFarcasterPageMetadataParams = {
  title: string;
  description: string;
  homeUrl: string;
  path?: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  buttonTitle?: string;
  searchParams?: SearchParams | Promise<SearchParams>;
};

async function resolveSearchParams(
  searchParams?: SearchParams | Promise<SearchParams>,
) {
  if (!searchParams) {
    return {} as SearchParams;
  }

  if (typeof (searchParams as Promise<SearchParams>).then === "function") {
    return (await searchParams) ?? {};
  }

  return searchParams;
}

function buildPageUrl(homeUrl: string, path: string, searchParams: SearchParams) {
  const normalizedBase = homeUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, entry));
    } else {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export async function getFarcasterPageMetadata({
  title,
  description,
  homeUrl,
  path = "",
  splashImageUrl,
  splashBackgroundColor = "#09090b",
  buttonTitle = "Open App",
  searchParams,
}: GetFarcasterPageMetadataParams): Promise<Metadata> {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const pageUrl = buildPageUrl(homeUrl, path, resolvedSearchParams);
  const previewImage = splashImageUrl || `${homeUrl.replace(/\/$/, "")}/api/og`;

  return {
    metadataBase: new URL(homeUrl),
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: previewImage }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": previewImage,
      "fc:frame:button:1": buttonTitle,
      "fc:frame:post_url": pageUrl,
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: previewImage,
        button: {
          title: buttonTitle,
          action: {
            type: "launch_frame",
            name: title,
            url: pageUrl,
            splashImageUrl: previewImage,
            splashBackgroundColor,
          },
        },
      }),
    },
  };
}
