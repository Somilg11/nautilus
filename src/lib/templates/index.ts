import { ThreeTierTemplate } from "./three-tier"
import { MicroservicesTemplate } from "./microservices"
import { UberTemplate } from "./most-asked/uber"
import { InstagramTemplate } from "./most-asked/instagram"
import { SpotifyTemplate } from "./most-asked/spotify"

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
