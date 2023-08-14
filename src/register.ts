import "./env";

const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/role-connections/metadata`;

/*
 * Register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */
enum MetadataType {
  INTEGER_LESS_THAN_OR_EQUAL = 1,
  INTEGER_GREATER_THAN_OR_EQUAL = 2,
  INTEGER_EQUAL = 3,
  INTEGER_NOT_EQUAL = 4,
  DATE_LESS_THAN_OR_EQUAL = 5,
  DATE_GREATER_THAN_OR_EQUAL = 6,
  BOOLEAN_EQUAL = 7,
  BOOLEAN_NOT_EQUAL = 8,
}

type Metadata = {
  type: MetadataType;
  key: string;
  name: string;
  description: string;
};

const body: Metadata[] = [
  {
    key: "cookieseaten",
    name: "Cookies Eaten",
    description: "Cookies Eaten Greater Than",
    type: MetadataType.INTEGER_LESS_THAN_OR_EQUAL,
  },
  {
    key: "allergictonuts",
    name: "Allergic To Nuts",
    description: "Is Allergic To Nuts",
    type: MetadataType.BOOLEAN_EQUAL,
  },
  {
    key: "bakingsince",
    name: "Baking Since",
    description: "Days since baking their first cookie",
    type: MetadataType.DATE_GREATER_THAN_OR_EQUAL,
  },
];

(async () => {
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    console.log(data);
  } else {
    const data = await response.text();
    throw new Error(data);
  }
})();
