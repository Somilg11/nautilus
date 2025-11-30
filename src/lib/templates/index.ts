import { ThreeTierTemplate } from "./three-tier"
import { MicroservicesTemplate } from "./microservices"
import { UberTemplate } from "./big/uber"
import { InstagramTemplate } from "./big/instagram"
import { SpotifyTemplate } from "./big/spotify"
import { NetflixTemplate } from "./big/netflix"
import { WhatsAppTemplate } from "./big/whatsapp"
import { YouTubeTemplate } from "./big/youtube"
import { ZomatoTemplate } from "./big/zomato"

export const AllTemplates = [
  ThreeTierTemplate,
  MicroservicesTemplate,
  UberTemplate,
  InstagramTemplate,
  SpotifyTemplate,
  NetflixTemplate,
  WhatsAppTemplate,
  YouTubeTemplate,
  ZomatoTemplate,
]

// Map by id for quick access
export const TemplatesMap = Object.fromEntries(
  AllTemplates.map((t) => [t.id, t])
)
