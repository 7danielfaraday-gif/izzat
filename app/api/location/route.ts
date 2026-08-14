type CloudflareGeo = {
  city?: string;
  region?: string;
  regionCode?: string;
  country?: string;
  countryCode?: string;
};

type CloudflareRequest = Request & { cf?: CloudflareGeo };

function clean(value?: string | null) {
  const normalized = value?.trim();
  return normalized && normalized.toLowerCase() !== "unknown" ? normalized : undefined;
}

export async function GET(request: Request) {
  const geo = (request as CloudflareRequest).cf;
  const country = clean(geo?.countryCode ?? geo?.country);
  const city = clean(geo?.city);
  const state = clean(geo?.regionCode ?? geo?.region);
  const isBrazil = !country || country.toUpperCase() === "BR" || country.toLowerCase() === "brazil";

  return Response.json(isBrazil && city ? { city, state } : {}, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Vary": "CF-IPCountry",
    },
  });
}
