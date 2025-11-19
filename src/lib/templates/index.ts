import { ThreeTierTemplate } from "./three-tier"
import { MicroservicesTemplate } from "./microservices"
import { UberTemplate } from "./big/uber"
import { InstagramTemplate } from "./big/instagram"
import { SpotifyTemplate } from "./big/spotify"

export const AllTemplates = [
  ThreeTierTemplate,
  MicroservicesTemplate,
  UberTemplate,
  InstagramTemplate,
  SpotifyTemplate,
]

// Map by id for quick access
export const TemplatesMap = Object.fromEntries(
  AllTemplates.map((t) => [t.id, t])
)
