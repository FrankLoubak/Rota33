/**
 * Finalidade: interface EmailProvider (D10) + adapter log/mock + factory por env.
 * Como funciona: desacopla o envio de e-mail; o adapter `log` registra e guarda a última
 *   mensagem por destinatário (para testes recuperarem o link/token sem SMTP real).
 * Relações: usado pelo authService (verificação de e-mail, reset). SMTP real é plugável.
 */
import { config } from "../../config/env";

export interface EmailProvider {
  nome: string;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

const ultima = new Map<string, string>();

class LogEmailProvider implements EmailProvider {
  nome = "log";
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    ultima.set(to, body);
    // eslint-disable-next-line no-console
    console.log(`[email:log] -> ${to} | ${subject}\n${body}`);
  }
}

// TODO: SmtpEmailProvider quando houver credenciais (config.emailProvider === 'smtp').
let instance: EmailProvider | undefined;
export function getEmailProvider(): EmailProvider {
  if (!instance) instance = new LogEmailProvider();
  void config.emailProvider;
  return instance;
}

// Utilitário de teste/dev: lê o corpo do último e-mail enviado a um destinatário.
export function lastEmailTo(to: string): string | undefined {
  return ultima.get(to);
}
