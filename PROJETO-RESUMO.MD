# Sistema de Visagismo — Regras de Negócio

## 1. Objetivo do sistema

Criar um sistema de acompanhamento de visagismo para barbeiros, consultores de imagem e profissionais de beleza masculina.

O sistema deve permitir que o profissional registre a conversa com o cliente, organize as informações em campos específicos, gere um dossiê final em PDF e mantenha tudo salvo em uma plataforma interna para consulta futura.

O sistema não deve funcionar apenas como um transcritor de áudio. Ele deve funcionar como um sistema de entrevista guiada com inteligência semântica, capaz de interpretar a conversa e transformar falas soltas em respostas organizadas dentro de um checklist estratégico.

---

## 2. Conceito principal

O sistema trabalha com blocos de intenção.

Cada fala do cliente ou do barbeiro deve ser analisada para entender qual campo ela responde.

A lógica principal é:

```text
Áudio → Transcrição → Quebra em blocos → Identificação de intenção → Classificação por campo → Resumo profissional → Revisão humana → Dossiê final
```

O sistema nunca deve apenas jogar um texto corrido dentro do formulário.

Cada campo deve receber apenas o conteúdo que faz sentido para aquela pergunta específica.

---

## 3. Tipos de entrada

O sistema deve aceitar duas formas principais de entrada de áudio.

### 3.1 Gravação ao vivo

O barbeiro poderá clicar em um botão como:

```text
Gravar conversa
```

A partir disso, o sistema grava a conversa entre barbeiro e cliente durante o atendimento.

### 3.2 Importação de áudio externo

O sistema também deve permitir que o barbeiro importe um áudio gravado fora da plataforma.

Exemplos:

* Áudio do WhatsApp
* Gravação do celular
* Áudio de reunião
* Áudio enviado pelo cliente
* Gravação feita em outro aplicativo

Depois do upload, o sistema deve transcrever e organizar o conteúdo da mesma forma que faria com uma gravação ao vivo.

---

## 4. Regras gerais para transcrição e preenchimento

### 4.1 Transcrição completa

Todo áudio deve gerar uma transcrição completa, com a conversa inteira preservada.

Essa transcrição pode ficar disponível para consulta interna, mas não deve ser usada diretamente no dossiê final.

### 4.2 Separação por falas

O sistema deve tentar separar quem está falando:

* Barbeiro
* Cliente

Quando não for possível identificar com certeza, o sistema deve marcar como fala não identificada.

### 4.3 Quebra em blocos

A conversa deve ser dividida em blocos menores de sentido.

Exemplo:

```text
Cliente: Eu trabalho com empresários e sinto que hoje minha imagem ainda parece muito jovem.
```

Esse trecho pode gerar dois blocos:

```text
Profissão / contexto profissional:
Atua em contato com empresários.

Como a imagem atual comunica:
Sente que sua imagem atual transmite juventude excessiva.
```

### 4.4 Classificação por intenção

Cada bloco deve responder à pergunta:

```text
Esse trecho responde qual campo do sistema?
```

Se o trecho não responder nenhum campo, ele deve ser ignorado no formulário e mantido apenas como contexto da transcrição.

### 4.5 Resumo obrigatório

O sistema não deve copiar a fala literal do cliente.

Ele deve transformar a fala em um texto claro, organizado e profissional.

Exemplo:

Fala original:

```text
Eu queria parecer mais sério, sabe? Porque no meu trabalho às vezes sinto que as pessoas não me levam tão a sério.
```

Preenchimento correto:

```text
Objetivo de imagem:
Transmitir mais seriedade, autoridade e credibilidade no ambiente profissional.
```

---

## 5. Regra de ouro

O sistema não é um campo de anotação livre.

O sistema é um organizador estratégico da conversa.

Cada campo deve conter:

* Resposta objetiva
* Linguagem profissional
* Sem repetição
* Sem texto corrido
* Sem excesso de detalhes
* Sem gírias desnecessárias
* Sem falas literais do cliente, exceto quando fizer sentido estratégico

---

## 6. Fluxo principal do sistema

### 6.1 Buscar ou criar cliente

O barbeiro deve conseguir:

* Pesquisar cliente pelo nome
* Criar novo cliente
* Abrir histórico do cliente
* Criar novo dossiê
* Consultar dossiês anteriores

### 6.2 Criar novo dossiê

Cada atendimento gera um novo dossiê.

Um cliente pode ter vários dossiês ao longo do tempo.

Exemplo:

```text
Cliente: Lucas Silva
Dossiê 1: Reposicionamento profissional — 10/05/2026
Dossiê 2: Atualização de imagem — 15/09/2026
```

### 6.3 Capturar informações

As informações podem vir de:

* Áudio gravado ao vivo
* Áudio importado
* Texto digitado manualmente
* Fotos do cliente
* Referências visuais
* Marcações feitas no iPad

### 6.4 Revisão pelo profissional

Antes de finalizar, o barbeiro deve revisar tudo.

O sistema deve permitir:

* Editar campos
* Apagar sugestões
* Reatribuir conteúdo para outro campo
* Completar manualmente
* Aprovar campos individualmente
* Aprovar o dossiê completo

### 6.5 Gerar dossiê final

Ao final, o sistema deve gerar:

* PDF
* Versão interna navegável no perfil do cliente

---

# 7. Estrutura do dossiê

## 7.1 Diagnóstico

Campos:

* Momento de vida atual
* Objetivo de imagem
* Profissão / contexto profissional
* Como a imagem atual comunica
* Pontos fortes da imagem atual
* Pontos que enfraquecem a presença

---

## 7.2 Análise Visagista

Campos:

* Foto do Cliente
* Upload Foto do Cliente
* Formato do rosto
* Estrutura facial
* Proporções visuais
* Harmonia estética
* Características dominantes
* Estilos que favorecem

---

## 7.3 Direcionamento de Corte

Campos:

* Estilo de corte ideal
* Estrutura do corte
* Referência 1
* Upload Referência 1
* Referência 2
* Upload Referência 2
* Referência 3
* Upload Referência 3

---

## 7.4 Direcionamento de Barba

Campos:

* Estilo de barba ideal
* Linha de contorno
* Referência 1
* Upload Referência 1
* Referência 2
* Upload Referência 2

---

## 7.5 Produtos

Campos:

* Nome do produto
* Descrição / uso
* Foto do produto
* Upload foto

---

## 7.6 Projeto Final

Campos:

* Direção visual recomendada
* Comunicação da nova imagem
* Estilo visual estratégico
* Resultado esperado

---

## 7.7 Finalização

Campos:

* Gerar Dossiê PDF
* Direcionamento técnico
* Ajustes personalizados

---

# 8. Regras por campo

# 8.1 Diagnóstico

## Momento de vida atual

### O que deve entrar

Contexto atual da vida do cliente.

Pode incluir:

* Nova fase profissional
* Mudança de cargo
* Separação
* Casamento
* Busca por autoestima
* Novo posicionamento
* Transição de estilo
* Mudança de rotina
* Busca por maturidade

### Gatilhos de fala

```text
Estou numa fase...
Agora eu...
Recentemente...
Mudei de...
Quero começar uma nova fase...
Estou querendo me cuidar mais...
```

### Regra de preenchimento

O sistema deve resumir o momento atual em 1 ou 2 frases.

### Exemplo

```text
Cliente está em uma fase de reposicionamento profissional e busca alinhar sua imagem a uma presença mais madura e confiante.
```

---

## Objetivo de imagem

### O que deve entrar

A intenção principal que o cliente quer transmitir.

Exemplos:

* Autoridade
* Confiança
* Maturidade
* Modernidade
* Sofisticação
* Leveza
* Criatividade
* Discrição
* Impacto
* Elegância
* Masculinidade
* Acessibilidade

### Gatilhos de fala

```text
Quero parecer...
Quero transmitir...
Quero passar uma imagem de...
Preciso que as pessoas me vejam como...
Quero ser visto como...
```

### Regra de preenchimento

Deve ser preenchido com uma ideia clara e estratégica.

### Exemplo

```text
Transmitir autoridade, maturidade e confiança, mantendo uma imagem moderna e acessível.
```

---

## Profissão / contexto profissional

### O que deve entrar

Informações sobre trabalho, rotina, público e ambiente social do cliente.

Pode incluir:

* Profissão
* Cargo
* Tipo de cliente que atende
* Ambiente formal ou informal
* Exposição em redes sociais
* Aparição em vídeo
* Contato com público
* Liderança
* Empreendedorismo

### Gatilhos de fala

```text
Eu trabalho com...
Meus clientes são...
Tenho reuniões com...
Apareço muito em vídeo...
Tenho empresa...
Sou vendedor...
Sou advogado...
Sou empresário...
```

### Regra de preenchimento

O sistema deve explicar o contexto e como ele exige determinada imagem.

### Exemplo

```text
Atua em ambiente profissional com contato direto com clientes, exigindo uma imagem confiável, bem cuidada e alinhada à autoridade.
```

---

## Como a imagem atual comunica

### O que deve entrar

A percepção da imagem atual do cliente.

Pode vir de:

* Como ele se vê
* Como acredita que os outros o veem
* Como o barbeiro interpreta sua imagem atual

### Gatilhos de fala

```text
Hoje eu acho que pareço...
As pessoas acham que eu...
Minha imagem passa...
Sinto que pareço...
Não sinto que minha imagem combina comigo...
```

### Regra de preenchimento

Deve descrever a comunicação atual da imagem, sem julgamento ofensivo.

### Exemplo

```text
A imagem atual comunica informalidade e juventude, mas ainda não reforça plenamente a autoridade desejada pelo cliente.
```

---

## Pontos fortes da imagem atual

### O que deve entrar

Elementos positivos já presentes na imagem do cliente.

Exemplos:

* Boa presença facial
* Barba com potencial
* Cabelo com bom volume
* Traços marcantes
* Expressão simpática
* Visual acessível
* Boa simetria
* Estilo pessoal autêntico

### Gatilhos de fala

```text
Gosto do meu...
Acho que meu ponto forte é...
Sempre elogiam meu...
Minha barba cresce bem...
Meu cabelo tem volume...
```

### Regra de preenchimento

Listar pontos positivos com objetividade.

### Exemplo

```text
Boa densidade capilar, barba com potencial de estruturação e traços faciais que favorecem uma imagem mais marcante.
```

---

## Pontos que enfraquecem a presença

### O que deve entrar

Aspectos que prejudicam a comunicação visual.

Exemplos:

* Corte sem estrutura
* Barba desalinhada
* Volume excessivo
* Falta de acabamento
* Imagem infantilizada
* Falta de contraste
* Desproporção entre cabelo e barba
* Pouca definição facial
* Visual cansado
* Falta de intenção estética

### Gatilhos de fala

```text
Não gosto...
Me incomoda...
Acho que parece desleixado...
Sinto que meu rosto fica...
Meu cabelo arma muito...
Minha barba falha...
```

### Regra de preenchimento

Transformar incômodos em diagnóstico visual.

### Exemplo

```text
A ausência de estrutura no corte e a falta de definição na barba reduzem a percepção de presença, maturidade e acabamento.
```

---

# 8.2 Análise Visagista

## Foto do Cliente / Upload Foto do Cliente

### O que deve entrar

Foto frontal, lateral ou outras imagens necessárias para análise.

### Regra de negócio

A foto deve ser usada para:

* Análise facial
* Marcação visual
* Comparação de antes/depois
* Geração do dossiê
* Desenho com iPad

A foto original nunca deve ser alterada. Toda edição ou marcação deve gerar uma versão separada.

---

## Formato do rosto

### O que deve entrar

Classificação do formato facial.

Exemplos:

* Oval
* Redondo
* Quadrado
* Retangular
* Triangular
* Diamante
* Coração

### Fonte

Pode vir de:

* Avaliação do barbeiro
* Análise assistida do sistema
* Informação manual

### Regra de preenchimento

Esse campo raramente deve vir da fala do cliente. Ele é principalmente técnico.

### Exemplo

```text
Oval
```

---

## Estrutura facial

### O que deve entrar

Descrição da estrutura do rosto.

Exemplos:

* Mandíbula marcada
* Rosto alongado
* Testa ampla
* Maçãs do rosto evidentes
* Queixo projetado
* Laterais suaves
* Traços arredondados

### Regra de preenchimento

Deve ser técnico, mas compreensível para o cliente.

### Exemplo

```text
Rosto com estrutura equilibrada, mandíbula suavemente marcada e proporções que permitem trabalhar cortes com maior definição lateral.
```

---

## Proporções visuais

### O que deve entrar

Relação entre cabelo, rosto, barba e volume.

### Regra de preenchimento

Esse campo deve ser interpretativo, não apenas falado.

### Exemplo

```text
As proporções favorecem laterais mais limpas e topo controlado, evitando excesso de volume que alongue visualmente o rosto.
```

---

## Harmonia estética

### O que deve entrar

Síntese da combinação entre traços, cabelo, barba e objetivo de imagem.

### Exemplo

```text
A harmonia estética pode ser fortalecida com linhas mais definidas, controle de volume e maior integração entre corte e barba.
```

---

## Características dominantes

### O que deve entrar

Principais características visuais do cliente.

### Regra

Listar até 5 características.

### Exemplo

```text
Traços suaves, boa densidade capilar, barba com potencial de estruturação, expressão acessível e formato facial equilibrado.
```

---

## Estilos que favorecem

### O que deve entrar

Direções estéticas compatíveis com o cliente.

### Regra

Deve cruzar:

* Objetivo de imagem
* Profissão
* Formato do rosto
* Estrutura facial
* Preferências do cliente

### Exemplo

```text
Estilos com laterais limpas, topo estruturado e acabamento natural favorecem uma imagem mais madura, profissional e confiante.
```

---

# 8.3 Direcionamento de Corte

## Estilo de corte ideal

### O que deve entrar

Nome e conceito do corte recomendado.

### Exemplos

* Degradê médio com topo estruturado
* Corte clássico com textura natural
* Corte social moderno
* French crop
* Side part
* Buzz cut estruturado
* Low fade discreto
* Corte médio alinhado

### Regra de preenchimento

Deve explicar por que o corte é ideal.

### Exemplo

```text
Degradê médio com topo estruturado, ideal para reforçar autoridade e manter uma imagem moderna sem perder elegância.
```

---

## Estrutura do corte

### O que deve entrar

Descrição técnica do corte.

Deve incluir:

* Laterais
* Topo
* Volume
* Textura
* Acabamento
* Manutenção

### Exemplo

```text
Laterais com degradê médio limpo, topo com comprimento suficiente para textura controlada e acabamento natural para manter sofisticação no dia a dia.
```

---

## Referência 1 / Upload Referência 1

### O que deve entrar

Imagem de referência visual do corte.

### Regra

Referências não devem ser geradas automaticamente a partir da transcrição, salvo se o barbeiro escolher imagens sugeridas pelo sistema.

---

## Referência 2 / Upload Referência 2

Mesma regra da referência 1.

---

## Referência 3 / Upload Referência 3

Mesma regra da referência 1.

---

# 8.4 Direcionamento de Barba

## Estilo de barba ideal

### O que deve entrar

Estilo de barba recomendado.

### Exemplos

* Barba cheia estruturada
* Barba curta alinhada
* Barba por fazer controlada
* Cavanhaque
* Bigode com barba baixa
* Barba média com contorno marcado
* Barba natural com acabamento limpo

### Gatilhos de fala

```text
Gosto de barba cheia...
Minha barba falha...
Não gosto de tirar muito...
Quero algo mais alinhado...
Quero parecer mais maduro...
```

### Regra de preenchimento

Deve cruzar preferência do cliente com formato do rosto e objetivo de imagem.

### Exemplo

```text
Barba curta estruturada, com linhas limpas e volume controlado, para reforçar maturidade e definição facial.
```

---

## Linha de contorno

### O que deve entrar

Descrição do desenho da barba.

Deve incluir:

* Linha da bochecha
* Linha do pescoço
* Contorno lateral
* Conexão com cabelo
* Simetria
* Altura ideal

### Exemplo

```text
Contorno levemente elevado nas bochechas, linha do pescoço limpa e conexão lateral integrada ao degradê para alongar e estruturar o rosto.
```

---

## Referência 1 / Upload Referência 1

Imagem de referência para barba.

---

## Referência 2 / Upload Referência 2

Imagem de referência para barba.

---

# 8.5 Produtos

## Nome do produto

### O que deve entrar

Produto recomendado para manutenção do visual.

Exemplos:

* Pomada efeito matte
* Balm para barba
* Óleo de barba
* Shampoo específico
* Modelador leve
* Tônico capilar
* Pente ou escova
* Spray fixador

---

## Descrição / uso

### O que deve entrar

Explicação simples de uso.

Deve responder:

* Para que serve
* Quando usar
* Como aplicar
* Qual resultado esperado

### Exemplo

```text
Pomada matte indicada para controlar o volume do topo e manter textura natural ao longo do dia, sem brilho excessivo.
```

---

## Foto / Upload Foto

Imagem do produto recomendado.

---

# 8.6 Projeto Final

## Direção visual recomendada

### O que deve entrar

Síntese da direção estética final.

### Exemplo

```text
Construir uma imagem mais madura, alinhada e profissional, com corte estruturado, barba definida e acabamento natural.
```

---

## Comunicação da nova imagem

### O que deve entrar

Como o cliente será percebido depois do direcionamento.

### Exemplo

```text
A nova imagem deve comunicar autoridade, confiança, cuidado pessoal e presença profissional.
```

---

## Estilo visual estratégico

### O que deve entrar

Nome ou conceito do posicionamento visual.

Exemplos:

* Executivo moderno
* Clássico sofisticado
* Masculino natural
* Autoridade acessível
* Criativo refinado
* Minimalista elegante
* Urbano profissional

### Exemplo

```text
Autoridade acessível, unindo presença profissional com naturalidade e modernidade.
```

---

## Resultado esperado

### O que deve entrar

Transformação esperada.

### Exemplo

```text
O resultado esperado é uma imagem mais coerente com o momento profissional do cliente, reforçando segurança, maturidade e boa apresentação.
```

---

# 8.7 Finalização

## Gerar Dossiê PDF

### O que deve acontecer

Ao finalizar, o sistema deve gerar um PDF com:

* Dados do cliente
* Data da consultoria
* Nome do profissional
* Diagnóstico
* Análise visagista
* Direcionamento de corte
* Direcionamento de barba
* Produtos recomendados
* Projeto final
* Fotos e referências aprovadas
* Imagens marcadas, quando selecionadas pelo barbeiro

### Regra

O PDF deve conter linguagem limpa e profissional.

Não deve conter:

* Transcrição bruta
* Erros de fala
* Repetições
* Timestamps
* Informações irrelevantes

---

## Direcionamento técnico

### O que deve entrar

Instrução técnica para execução do corte e barba.

### Exemplo

```text
Executar degradê médio com transição suave, manter topo com textura controlada e alinhar barba curta com contorno limpo na região do pescoço e bochechas.
```

---

## Ajustes personalizados

### O que deve entrar

Observações específicas para aquele cliente.

Exemplos:

* Evitar muito volume lateral
* Manter comprimento no topo
* Não baixar demais a barba
* Respeitar falhas naturais
* Evitar acabamento muito marcado
* Usar produto matte
* Retorno em 20 dias

### Exemplo

```text
Evitar excesso de volume nas laterais e manter contorno da barba mais natural para preservar masculinidade sem endurecer demais a expressão.
```

---

# 9. Menu: Análise Visual no iPad / Desenhar com iPad

## 9.1 Objetivo

Permitir que o barbeiro abra a foto do cliente e faça marcações visuais diretamente na imagem, usando o iPad, para explicar pontos de análise, correção e direcionamento.

Esse recurso serve para transformar a consultoria em uma experiência mais visual, didática e consultiva.

---

## 9.2 Nome sugerido no menu

Opções possíveis:

```text
Análise Visual no iPad
Desenhar com iPad
Marcação Técnica
Mapa Visual
Anotar Foto
```

Nome recomendado:

```text
Análise Visual no iPad
```

Também pode aparecer como subtítulo:

```text
Desenhar sobre a foto do cliente
```

---

## 9.3 Como funciona

Fluxo:

```text
1. Barbeiro acessa o cliente
2. Abre o dossiê atual
3. Clica em "Análise Visual no iPad"
4. Sistema abre a foto do cliente em tela cheia
5. Barbeiro desenha por cima da imagem
6. Sistema salva a imagem marcada como uma nova versão
7. Barbeiro escolhe se essa versão entra ou não no PDF
```

---

## 9.4 Ferramentas disponíveis

O modo de desenho deve permitir:

* Caneta livre
* Borracha
* Setas
* Círculos
* Linhas retas
* Texto curto
* Marcador
* Desfazer
* Refazer
* Salvar versão
* Duplicar versão
* Comparar antes/depois

---

## 9.5 O que o barbeiro pode marcar

O barbeiro pode usar a foto para mostrar:

* Formato do rosto
* Linha da mandíbula
* Altura ideal do degradê
* Volume excessivo
* Áreas que precisam ser suavizadas
* Linha de contorno da barba
* Simetria facial
* Direção do corte
* Proporção entre cabelo, rosto e barba
* Pontos de sombra
* Pontos de luz
* Onde alongar visualmente
* Onde reduzir volume
* Onde criar definição
* Onde preservar naturalidade

---

## 9.6 Regras de negócio

* A imagem original nunca deve ser alterada.
* Toda marcação deve gerar uma nova versão.
* O barbeiro pode criar múltiplas versões.
* Cada versão deve ter data e nome.
* O barbeiro pode renomear a versão.
* O barbeiro pode excluir versões.
* O sistema deve manter histórico das versões.
* A imagem marcada pode entrar no PDF final.
* O barbeiro escolhe se a imagem marcada será visível para o cliente.
* O sistema deve permitir comparar foto original e foto marcada.
* O sistema deve permitir comparar foto inicial e resultado final.
* A marcação deve ficar vinculada ao dossiê específico, não apenas ao cliente.

---

## 9.7 Exemplos de nomes de versões

```text
Análise inicial
Proposta de contorno
Direção de corte
Correção de volume lateral
Linha ideal da barba
Antes do atendimento
Resultado final
```

---

## 9.8 Uso durante a consultoria

Esse recurso deve ajudar o barbeiro a explicar visualmente o raciocínio.

Exemplo:

```text
Aqui vamos limpar mais a lateral para reduzir o volume.
Aqui vamos manter estrutura para alongar o rosto.
Aqui a barba precisa subir um pouco para reforçar a mandíbula.
```

Essas marcações podem depois ser resumidas automaticamente em campos como:

* Estrutura facial
* Proporções visuais
* Linha de contorno
* Estrutura do corte
* Direcionamento técnico
* Ajustes personalizados

---

# 10. Plataforma interna do cliente

## 10.1 Objetivo

O PDF é importante, mas o sistema interno deve ser ainda mais útil para o barbeiro.

O barbeiro deve conseguir abrir o cliente dentro da plataforma e ver tudo sem depender do PDF.

---

## 10.2 Perfil do cliente

Cada cliente deve ter uma página com:

* Nome
* Foto principal
* Telefone
* Instagram
* Histórico de dossiês
* Fotos anteriores
* Fotos finais
* Preferências
* Observações
* Produtos recomendados
* Próximo retorno
* Último atendimento
* Dossiê atual

---

## 10.3 Histórico

O sistema deve permitir acompanhar evolução.

Exemplo:

```text
Atendimento 1: Reposicionamento profissional
Atendimento 2: Manutenção do corte
Atendimento 3: Ajuste de barba
Atendimento 4: Nova fase de imagem
```

---

## 10.4 Busca de cliente

O barbeiro deve conseguir pesquisar por:

* Nome
* Telefone
* Instagram
* Data do atendimento
* Tipo de serviço
* Objetivo de imagem

---

# 11. Regras de aprovação

## 11.1 Status dos campos

Cada campo pode ter status:

```text
Vazio
Sugerido pela IA
Editado pelo barbeiro
Aprovado
```

---

## 11.2 O dossiê só deve ser finalizado quando

* Campos obrigatórios estiverem preenchidos
* Barbeiro revisar o conteúdo
* Fotos principais forem anexadas
* Direcionamento final estiver aprovado

---

# 12. Campos obrigatórios sugeridos

Para gerar o dossiê final, os campos mínimos deveriam ser:

* Nome do cliente
* Data
* Objetivo de imagem
* Profissão / contexto profissional
* Como a imagem atual comunica
* Formato do rosto
* Estilo de corte ideal
* Estrutura do corte
* Estilo de barba ideal
* Direção visual recomendada
* Resultado esperado
* Direcionamento técnico

---

# 13. Campos opcionais

Podem ser opcionais:

* Referências visuais
* Produtos
* Vídeo explicativo
* Instagram do profissional
* Marcações no iPad
* Ajustes personalizados
* Foto final

---

# 14. Regras para IA / interpretação semântica

## 14.1 O sistema deve identificar intenções

Tipos de intenção:

```text
Contexto de vida
Objetivo de imagem
Profissão
Incômodo visual
Preferência estética
Rejeição estética
Análise técnica
Recomendação de corte
Recomendação de barba
Produto
Ajuste personalizado
Resultado desejado
```

---

## 14.2 O sistema deve ignorar ruídos

Não devem ir para o formulário:

* Cumprimentos
* Piadas
* Interrupções
* Conversa paralela
* Confirmações sem conteúdo
* Repetições
* Trechos incompletos sem sentido

Exemplo:

```text
Ah, entendi.
Legal.
Sim, sim.
Tipo assim...
Deixa eu ver.
```

---

## 14.3 O sistema deve consolidar informações repetidas

Se o cliente repetir várias vezes que quer parecer mais sério, o sistema deve preencher uma única vez de forma consolidada.

Exemplo:

```text
Objetivo de imagem:
Transmitir mais seriedade, autoridade e maturidade.
```

---

## 14.4 O sistema deve preservar contradições importantes

Se o cliente disser algo contraditório, o sistema deve sinalizar para revisão.

Exemplo:

```text
Cliente deseja uma imagem de autoridade, mas demonstra preferência por cortes muito despojados. Recomenda-se alinhar expectativa visual antes da execução.
```

---

# 15. Exemplos práticos de mapeamento

## Exemplo 1

Fala:

```text
Eu trabalho com vendas, atendo muito empresário e queria parecer mais confiável.
```

Preenchimento:

```text
Profissão / contexto profissional:
Atua com vendas e atendimento a empresários.

Objetivo de imagem:
Transmitir mais confiança e credibilidade.
```

---

## Exemplo 2

Fala:

```text
Meu cabelo fica muito armado dos lados e acho que isso me deixa meio desleixado.
```

Preenchimento:

```text
Pontos que enfraquecem a presença:
O excesso de volume nas laterais prejudica a percepção de acabamento e organização da imagem.

Estrutura do corte:
Recomenda-se controle de volume lateral com acabamento mais limpo.
```

---

## Exemplo 3

Fala:

```text
Eu gosto da minha barba, mas ela falha um pouco aqui perto da bochecha.
```

Preenchimento:

```text
Pontos fortes da imagem atual:
Barba valorizada pelo cliente e com potencial de estruturação.

Linha de contorno:
Ajustar linha da bochecha respeitando as falhas naturais para manter aparência limpa e equilibrada.
```

---

## Exemplo 4

Fala:

```text
Quero um visual mais maduro, mas não quero ficar com cara de velho.
```

Preenchimento:

```text
Objetivo de imagem:
Transmitir maturidade sem perder modernidade e leveza.

Estilo visual estratégico:
Autoridade acessível.
```

---

# 16. Regras para PDF

## 16.1 O PDF deve ser uma entrega premium

O PDF deve parecer um dossiê profissional, não um formulário preenchido automaticamente.

Deve conter:

* Capa
* Dados do cliente
* Diagnóstico
* Análise visagista
* Direcionamento de corte
* Direcionamento de barba
* Produtos
* Projeto final
* Imagens e referências
* Considerações finais

---

## 16.2 Linguagem do PDF

A linguagem deve ser:

* Profissional
* Clara
* Elegante
* Sem excesso técnico
* Fácil para o cliente entender

---

## 16.3 O que não deve aparecer no PDF

* Transcrição completa
* Falas desconexas
* Trechos repetidos
* Campos vazios
* Observações internas não aprovadas
* Erros da IA
* Marcação visual não autorizada pelo barbeiro

---

# 17. Permissões e visibilidade

## 17.1 Conteúdo interno

Alguns conteúdos podem ser apenas para o barbeiro.

Exemplos:

* Observações técnicas internas
* Alertas de inconsistência
* Notas de atendimento
* Transcrição bruta
* Versões não aprovadas

---

## 17.2 Conteúdo visível ao cliente

O cliente deve receber apenas:

* Dossiê final
* Fotos aprovadas
* Recomendações aprovadas
* Direcionamento final
* Produtos indicados
* Explicações claras

---

# 18. Experiência ideal para o barbeiro

O barbeiro deve sentir que o sistema:

* Economiza tempo
* Organiza a conversa
* Valoriza o atendimento
* Ajuda a vender uma consultoria premium
* Facilita o retorno do cliente
* Melhora a percepção profissional

---

# 19. Experiência ideal para o cliente

O cliente deve sentir que recebeu:

* Uma consultoria personalizada
* Um diagnóstico profissional
* Clareza sobre sua imagem
* Direção visual objetiva
* Justificativa para o corte e barba
* Material para consultar depois
* Percepção de valor elevado

---

# 20. Resumo do produto

Este sistema deve ser entendido como:

```text
Um sistema de acompanhamento de visagismo que transforma uma conversa entre barbeiro e cliente em um dossiê estratégico, visual e organizado.
```

Ele combina:

* Transcrição
* Interpretação
* Checklist inteligente
* Análise visual
* Histórico do cliente
* PDF final
* Plataforma interna

O diferencial não é apenas gravar a conversa.

O diferencial é transformar o atendimento em uma experiência consultiva, estruturada e premium.



# IMPORTANTE
VAMOS USAR IA GEMINI PARA FAZER O PROCESSO DE TRANSCRICAO E ANALISE DE ENTAO GERAR O DOSSIÊ.
O SISTEMA SERÁ RESPONSAVEL POR COLETAR O AUDIO DO CLIENTE E ENVIAR PARA A IA GEMINI PARA FAZER O PROCESSO DE TRANSCRICAO E ANALISE.

OU SEJA TODO ESSE PROCESSAMENTO QUE SERIA PERSONALIZADO SERA IA