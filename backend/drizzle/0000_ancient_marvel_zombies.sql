CREATE TYPE "public"."assinatura_status" AS ENUM('ativa', 'atrasada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."assinatura_tier" AS ENUM('gratuito', 'pago_1', 'pago_2', 'pago_3');--> statement-breakpoint
CREATE TYPE "public"."carteira_origem" AS ENUM('renovacao_tier', 'compra_avulsa');--> statement-breakpoint
CREATE TYPE "public"."parada_origem" AS ENUM('manual', 'foto', 'voz');--> statement-breakpoint
CREATE TYPE "public"."parada_status" AS ENUM('pendente', 'concluida', 'pulada');--> statement-breakpoint
CREATE TYPE "public"."prioridade" AS ENUM('baixa', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."provedor_login" AS ENUM('email', 'google', 'apple');--> statement-breakpoint
CREATE TYPE "public"."rota_status" AS ENUM('planejamento', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."transacao_acao" AS ENUM('adicionar_ponto_manual', 'adicionar_ponto_voz', 'adicionar_ponto_foto', 'otimizar_rota', 'reotimizar_rota');--> statement-breakpoint
CREATE TABLE "anuncios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"data_exibicao" timestamp with time zone DEFAULT now() NOT NULL,
	"tela_exibicao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assinaturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"tier" "assinatura_tier" DEFAULT 'gratuito' NOT NULL,
	"status" "assinatura_status" DEFAULT 'ativa' NOT NULL,
	"data_inicio" timestamp with time zone DEFAULT now() NOT NULL,
	"data_proximo_vencimento" timestamp with time zone,
	"provider_usado" text,
	"limite_creditos_periodo" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capturas_ocr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_parada" uuid,
	"imagem_referencia" text NOT NULL,
	"texto_extraido_bruto" text,
	"endereco_confirmado_pelo_usuario" boolean DEFAULT false NOT NULL,
	"data_captura" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carteiras_creditos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"saldo_atual" integer DEFAULT 0 NOT NULL,
	"data_ultima_renovacao" timestamp with time zone,
	"origem" "carteira_origem",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carteiras_creditos_id_usuario_unique" UNIQUE("id_usuario")
);
--> statement-breakpoint
CREATE TABLE "paradas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_rota" uuid NOT NULL,
	"endereco_texto" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"ordem_original" integer NOT NULL,
	"ordem_otimizada" integer,
	"janela_horario_inicio" time,
	"janela_horario_fim" time,
	"prioridade" "prioridade",
	"origem_entrada" "parada_origem" DEFAULT 'manual' NOT NULL,
	"status" "parada_status" DEFAULT 'pendente' NOT NULL,
	"descricao_pacote" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registros_trajeto_gps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_rota" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"status" "rota_status" DEFAULT 'planejamento' NOT NULL,
	"data_criacao" timestamp with time zone DEFAULT now() NOT NULL,
	"data_inicio_execucao" timestamp with time zone,
	"data_fim_execucao" timestamp with time zone,
	"distancia_total_planejada" numeric(12, 2),
	"distancia_total_executada" numeric(12, 2),
	"tempo_total_planejado" integer,
	"tempo_total_executado" integer,
	"modo_offline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacoes_credito" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"acao" "transacao_acao" NOT NULL,
	"creditos_consumidos" integer NOT NULL,
	"data" timestamp with time zone DEFAULT now() NOT NULL,
	"id_rota" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text,
	"provedor_login" "provedor_login" DEFAULT 'email' NOT NULL,
	"data_cadastro" timestamp with time zone DEFAULT now() NOT NULL,
	"idioma_preferido" text DEFAULT 'pt-BR' NOT NULL,
	"pais" text DEFAULT 'BR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capturas_ocr" ADD CONSTRAINT "capturas_ocr_id_parada_paradas_id_fk" FOREIGN KEY ("id_parada") REFERENCES "public"."paradas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carteiras_creditos" ADD CONSTRAINT "carteiras_creditos_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paradas" ADD CONSTRAINT "paradas_id_rota_rotas_id_fk" FOREIGN KEY ("id_rota") REFERENCES "public"."rotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_trajeto_gps" ADD CONSTRAINT "registros_trajeto_gps_id_rota_rotas_id_fk" FOREIGN KEY ("id_rota") REFERENCES "public"."rotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rotas" ADD CONSTRAINT "rotas_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes_credito" ADD CONSTRAINT "transacoes_credito_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes_credito" ADD CONSTRAINT "transacoes_credito_id_rota_rotas_id_fk" FOREIGN KEY ("id_rota") REFERENCES "public"."rotas"("id") ON DELETE no action ON UPDATE no action;