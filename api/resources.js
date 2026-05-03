const fallbackResources = [
  {
    title: "Election Commission of India",
    url: "https://www.eci.gov.in/",
    source: "official"
  },
  {
    title: "Voter Services Portal",
    url: "https://voters.eci.gov.in/",
    source: "official"
  },
  {
    title: "Electoral Search",
    url: "https://electoralsearch.eci.gov.in/",
    source: "official"
  }
];

module.exports = async function handler(request, response) {
  const region = String(request.query?.region || "").slice(0, 80);
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    return response.status(200).json({
      source: "curated",
      resources: fallbackResources,
      googleSearchUrl: buildGoogleSearchUrl(region),
      googleMapsUrl: buildGoogleMapsUrl(region)
    });
  }

  try {
    const query = encodeURIComponent(`official election voter registration polling booth ${region} India`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${query}&num=3`;
    const googleResponse = await fetch(url);

    if (!googleResponse.ok) {
      throw new Error("Google Custom Search failed");
    }

    const data = await googleResponse.json();
    const resources = (data.items || []).slice(0, 3).map((item) => ({
      title: item.title,
      url: item.link,
      source: "google-custom-search"
    }));

    return response.status(200).json({
      source: "google-custom-search",
      resources: resources.length ? resources : fallbackResources,
      googleSearchUrl: buildGoogleSearchUrl(region),
      googleMapsUrl: buildGoogleMapsUrl(region)
    });
  } catch (error) {
    return response.status(200).json({
      source: "curated-fallback",
      resources: fallbackResources,
      googleSearchUrl: buildGoogleSearchUrl(region),
      googleMapsUrl: buildGoogleMapsUrl(region)
    });
  }
};

function buildGoogleSearchUrl(region) {
  const query = encodeURIComponent(`official election voter services ${region} India`);
  return `https://www.google.com/search?q=${query}`;
}

function buildGoogleMapsUrl(region) {
  const query = encodeURIComponent(`election office ${region} India`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
