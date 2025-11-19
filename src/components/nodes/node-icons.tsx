// components/nodes/node-icons.tsx
import { JSX } from "react"

/* ===============================
   CLIENTS
=============================== */
import { FaUser, FaDesktop, FaMobileAlt } from "react-icons/fa"

/* ===============================
   SERVERS / API
=============================== */
import { FaServer, FaKey, FaShieldAlt, FaLock } from "react-icons/fa"

/* ===============================
   DATABASES
=============================== */
import {
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiApachecassandra,
  SiRedis,
  SiSqlite,
} from "react-icons/si"
import { FaDatabase } from "react-icons/fa"

/* ===============================
   CLOUD PROVIDERS / STORAGE
=============================== */
import {
  SiGooglecloud,
  SiCloudflare,
  SiDigitalocean,
  SiOpenstack,
  SiMinio,
  SiFirebase,
  SiSupabase
} from "react-icons/si"
import { FaAws } from "react-icons/fa"
import { VscAzure } from "react-icons/vsc"

/* ===============================
   MEDIA / ASSET DELIVERY
=============================== */
import {
  SiImagedotsc as SiImagekit,
  SiCloudways as SiUploadcare,
  SiCloudinary,
} from "react-icons/si"

/* ===============================
   PAYMENTS / BILLING
=============================== */
import {
  SiStripe,
  SiRazorpay,
  SiPaypal,
  SiPayoneer,
  SiCashapp,
  SiPaddle,
} from "react-icons/si"
import { FaMoneyBill } from "react-icons/fa"

/* ===============================
   AUTH PROVIDERS
=============================== */
import {
  SiClerk,
  SiAuth0,
  SiFirebase as SiFirebaseAuth,
  SiSupabase as SiSupabaseAuth,
} from "react-icons/si"
import { FaUserShield } from "react-icons/fa"

/* ===============================
   CONTAINERS / DEVOPS
=============================== */
import { SiDocker, SiKubernetes, SiTraefikproxy, SiNginx } from "react-icons/si"

/* ===============================
   QUEUES / STREAMING
=============================== */
import {
  SiApachekafka as SiKafka,
  SiRabbitmq,
  SiAmazonsqs,
} from "react-icons/si"

/* ===============================
   OBSERVABILITY
=============================== */
import {
  SiGrafana,
  SiPrometheus,
  SiElastic,
  SiLogstash,
  SiKibana,
} from "react-icons/si"

/* ===============================
   NETWORKING
=============================== */
import { FaNetworkWired, FaGlobe, FaCloud } from "react-icons/fa"

/* ===============================
   MICROSERVICES
=============================== */
import { FaCubes } from "react-icons/fa"

/* ===============================
   STORAGE
=============================== */
import { FaHdd } from "react-icons/fa"

/* ===============================
   MISC
=============================== */
import { FaRocket, FaTools } from "react-icons/fa"

export const NodeIcons: Record<string, JSX.Element> = {
  /* ------------------ CLIENTS ------------------ */
  user: <FaUser />,
  client_web: <FaDesktop />,
  client_mobile: <FaMobileAlt />,

  /* ------------------ SERVERS ------------------ */
  web_server: <FaServer />,
  api_server: <FaServer />,
  auth: <FaKey />,
  firewall: <FaShieldAlt />,
  vpn: <FaLock />,

  /* ------------------ DATabases ------------------ */
  database_sql: <FaDatabase />,
  mysql: <SiMysql />,
  postgres: <SiPostgresql />,
  mongodb: <SiMongodb />,
  cassandra: <SiApachecassandra />,
  sqlite: <SiSqlite />,

  /* ------------------ Caches ------------------ */
  cache: <SiRedis />,
  redis: <SiRedis />,

  /* ------------------ Queueing ------------------ */
  kafka: <SiKafka />,
  rabbitmq: <SiRabbitmq />,
  sqs: <SiAmazonsqs />,
  queue: <SiKafka />,

  /* ------------------ Networking ------------------ */
  load_balancer: <SiNginx />,
  reverse_proxy: <SiTraefikproxy />,
  cdn: <SiCloudflare />,
  dns: <FaGlobe />,
  internet: <FaGlobe />,
  vpc: <FaNetworkWired />,

  /* ------------------ Cloud Providers ------------------ */
  aws: <FaAws />,
  gcp: <SiGooglecloud />,
  azure: <VscAzure />,
  cloudflare: <SiCloudflare />,
  digitalocean: <SiDigitalocean />,
  openstack: <SiOpenstack />,

  /* ------------------ Media / Storage ------------------ */
  s3: <FaAws />,
  minio: <SiMinio />,
  cloudinary: <SiCloudinary />,
  imagekit: <SiImagekit />,
  uploadcare: <SiUploadcare />,
  firebase_storage: <SiFirebase />,
  supabase_storage: <SiSupabase />,

  /* ------------------ Payment Gateways ------------------ */
  stripe: <SiStripe />,
  razorpay: <SiRazorpay />,
  paypal: <SiPaypal />,
  payoneer: <SiPayoneer />,
  cashfree: <SiCashapp />,
  paddle: <SiPaddle />,
  billing: <FaMoneyBill />,

  /* ------------------ Auth Providers ------------------ */
  clerk: <SiClerk />,
  auth0: <SiAuth0 />,
  firebase_auth: <SiFirebaseAuth />,
  supabase_auth: <SiSupabaseAuth />,
  better_auth: <FaUserShield />,
  custom_auth: <FaKey />,

  /* ------------------ Containers / DevOps ------------------ */
  docker: <SiDocker />,
  k8s: <SiKubernetes />,
  kubernetes: <SiKubernetes />,
  container: <SiDocker />,
  traefik: <SiTraefikproxy />,

  /* ------------------ Microservices ------------------ */
  microservice: <FaCubes />,
  service: <FaCubes />,

  /* ------------------ Storage ------------------ */
  block_storage: <FaHdd />,
  object_storage: <FaCloud />, // generic

  /* ------------------ Observability ------------------ */
  grafana: <SiGrafana />,
  prometheus: <SiPrometheus />,
  elastic: <SiElastic />,
  logstash: <SiLogstash />,
  kibana: <SiKibana />,

  /* ------------------ Misc ------------------ */
  orchestrator: <FaTools />,
  cd: <FaRocket />,
  ci: <FaRocket />,
}
