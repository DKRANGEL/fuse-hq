# fuse-hq — Escritório virtual do Mateus (fork do Pixel Agents)

> Fork de [pixel-agents-hq/pixel-agents](https://github.com/pixel-agents-hq/pixel-agents) (MIT). Este documento é ponto de partida para o Claude Code continuar o trabalho — não é spec fechada. Questione, proponha alternativa, aponte furo.

## 1. O que é isto e o que NÃO é ainda

Escritório virtual em pixel art para o Mateus (dono da Magic Fireworks e outras empresas). Entrega desta semana é **só o esboço visual** — decisão já combinada e comunicada ao cliente:

- **Tem:** sala(s) com a identidade visual da empresa, personagem(ns) parado(s)/com animação básica de "em espera".
- **NÃO tem ainda:** nenhum agente de IA respondendo de verdade. Isso é intencional, combinado e comunicado — não é um bug nem uma pendência escondida.
- Não confundir esta entrega com o projeto separado "IA de pedido por WhatsApp" (outro documento, outro escopo, outra cobrança) nem com o roadmap de agentes (viagem/marketing/jurídico/etc.) do documento de arquitetura geral.

## 2. Decisão de arquitetura já tomada (não reabrir sem motivo forte)

**Os agentes de verdade (quando existirem) NÃO serão sessões de Claude Code CLI.** Serão um serviço próprio (Node, já na stack do MF Manager) chamando a API da Anthropic e de outros provedores diretamente, com roteamento de modelo por tarefa (ex.: Haiku para triagem, modelo maior para raciocínio, aberto barato onde servir). Motivo: previsibilidade de custo, controle de comportamento, e porque os agentes vão eventualmente tocar sistemas reais (MF Manager, WhatsApp) — não cabe depender de um terminal de dev interativo em produção 24/7.

**Consequência direta para este repo:** o Pixel Agents, do jeito que vem de fábrica, só entende sessões de Claude Code (via hooks ou lendo `~/.claude/projects/*.jsonl`). Isso é irrelevante para a entrega desta semana (esboço sem agente). Mas quando o primeiro agente real for plugado (próxima fase), ele **não vai aparecer sozinho** na tela só por existir — precisa de uma ponte. Ver seção 4.

## 3. Customização visual (identidade da empresa) — sem tocar no core

O próprio Pixel Agents já suporta isto nativamente, então **não fork/reescreva os arquivos de asset do core** para trocar a identidade visual:

- **Settings → Add Asset Directory**: carrega uma pasta externa de mobília/personagem/decoração, mesclada com o catálogo padrão. Path salvo em `~/.pixel-agents/config.json`.
- Estrutura exigida (ver `docs/external-assets.md` do upstream, copiado/adaptado aqui se necessário):
  ```
  meus-assets/
    assets/
      furniture/
        NOME_DO_ITEM/
          manifest.json
          NOME_DO_ITEM.png
  ```
- O layout (paredes, piso, cores, posição de móveis) é editado pelo botão **Layout** na própria UI e persiste em `~/.pixel-agents/layout.json` — não precisa codar posicionamento à mão.
- `scripts/asset-manager.html` (vem no repo) ajuda a gerar o `manifest.json` de cada peça nova sem escrever JSON manualmente.

**Tarefa concreta desta fase:** montar uma pasta de assets com a paleta/identidade da empresa (cores de parede/piso, um item de decoração com o logo, se possível um personagem recolorido) e carregar via Add Asset Directory. Preferir isso a qualquer alteração em `webview-ui/public/assets/` (que é o catálogo do upstream — mexer lá dificulta atualizar o fork depois).

## 4. A ponte para o agente real (próxima fase — não fazer agora, mas desenhar sabendo disto)

Achado importante ao inspecionar o código: a arquitetura já prevê exatamente este caso.

- `core/src/provider.ts` define `AgentEvent` como um modelo **normalizado**, não específico de Claude: `toolStart`, `toolEnd`, `turnEnd`, `permissionRequest`, `sessionStart`, etc.
- Hoje só existe um `HookProvider` implementado (`server/src/providers/hook/claude/`), mas a interface é desenhada para múltiplos providers — o próprio README do upstream diz que adicionar uma ferramenta nova é "um subdiretório de código, não uma reescrita".
- O servidor expõe `POST /api/hooks/:providerId` (autenticado por Bearer token), que aceita qualquer payload com `session_id` e `hook_event_name` e despacha para o provider correspondente normalizar.

**Isso significa:** quando o agente de verdade (serviço próprio, multi-modelo) existir, a forma correta de acender o boneco na tela **não é** rodar Claude Code CLI de verdade. É escrever um **provider próprio** (`server/src/providers/hook/<algo>/`) que traduz o ciclo de vida do teu serviço (ex.: "tarefa recebida" → `sessionStart`, "processando" → `toolStart`, "respondeu" → `turnEnd`) em `AgentEvent`, e o teu serviço posta esses eventos sintéticos para `/api/hooks/<seu-provider-id>` com um `session_id` que ele mesmo controla.

Isto é apenas registro de achado técnico para quando chegarmos lá — **não implementar nesta fase**. Left aqui para não redescobrir isto do zero na próxima conversa.

## 5. Perguntas abertas para decidir com o Claude Code olhando o código de perto

- Uma sala só ou várias (uma por "empresa"/assunto)? Combinado com o cliente até agora: começar com uma, simples.
- O personagem "em espera" usa algum dos 6 personagens base (recolorido) ou é sprite customizado do zero? Recomendação: recolorir um base primeiro — mais rápido, e dá pra trocar depois sem afetar layout.
- Onde este serviço vai rodar em produção depois (fora do laptop)? Standalone CLI bind em `127.0.0.1` por padrão; expor na rede exige `--host 0.0.0.0`, que o próprio README avisa só fazer em rede confiável. Decidir isso quando saíres do "mostrar no laptop" para "o Mateus acessa de qualquer lugar" — provavelmente atrás do mesmo VPS/Nginx do MF Manager, não exposto direto.
- Manter como fork sincronizável do upstream (`git remote add upstream ...` para trazer atualizações) ou desligar completamente do upstream depois que a customização crescer? Recomendação inicial: manter sincronizável enquanto a customização for só assets externos (não toca no core, então merge de upstream deve ser tranquilo por um bom tempo).

## 6. Fora de escopo (não fazer sem decisão explícita nova)

- Qualquer agente respondendo de verdade nesta fase.
- Expor o servidor fora de `127.0.0.1` / rede local.
- Editar arquivos dentro de `webview-ui/public/assets/` (usar Add Asset Directory em vez disso).
- Multiempresa / múltiplas salas (fase futura, não combinada ainda com o cliente).

---

*Documento vivo. Atualizar conforme decisões forem tomadas com o Claude Code e com o cliente.*
