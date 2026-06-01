export default function Head() {
  const title = "ShadowScore | Marketplace Risk Intelligence";
  const description =
    "Independent marketplace risk assessments for sellers facing MC011, MC999, payout holds, tracking issues and marketplace reviews.";
  const image = "https://shadowscore.io/marketplaces-monitor-v8.png";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://shadowscore.io/" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:alt" content="ShadowScore Marketplace Risk Intelligence" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
