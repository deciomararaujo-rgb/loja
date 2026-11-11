// Catálogo inicial da loja. Depois do primeiro acesso tudo passa a ser editado pelo painel (/admin).

export type SeedProduct = {
  categorySlug: string;
  subcategory: string;
  name: string;
  brand: string;
  priceCents: number;
  description: string;
  featured: boolean;
};

const p = (
  categorySlug: string,
  subcategory: string,
  name: string,
  brand: string,
  price: number,
  description: string,
  featured = false,
): SeedProduct => ({ categorySlug, subcategory, name, brand, priceCents: Math.round(price * 100), description, featured });

export const SEED_CATEGORIES = [
  { slug: "masculinos", name: "Masculinos", tagline: "Perfumes árabes masculinos, do fresco ao intenso, com fixação que acompanha o dia inteiro.", sort: 1 },
  { slug: "femininos", name: "Femininos", tagline: "Florais, gourmands e orientais femininos para cada momento.", sort: 2 },
  { slug: "body-splash", name: "Body Splash", tagline: "Body splash e kits com loção hidratante para perfumar a pele o dia todo.", sort: 3 },
  { slug: "cremes", name: "Creme Corporal", tagline: "Cremes corporais perfumados com as fragrâncias mais amadas.", sort: 4 },
  { slug: "esfoliantes", name: "Esfoliantes", tagline: "Esfoliantes de açúcar Stella Dustin para uma pele macia e perfumada.", sort: 5 },
  { slug: "cabelos", name: "Cabelos", tagline: "Shampoos, condicionadores, máscaras e tratamentos importados.", sort: 6 },
  { slug: "kits", name: "Kits Presente", tagline: "Kits Lattafa e Ameerat prontos para presentear.", sort: 7 },
  { slug: "stella-dustin", name: "Stella Dustin", tagline: "Kits, banho e glow corporal da Stella Dustin.", sort: 8 },
];

const M = "masculinos";
const F = "femininos";
const B = "body-splash";
const C = "cremes";
const E = "esfoliantes";
const H = "cabelos";
const K = "kits";
const S = "stella-dustin";

const VS = "Victoria's Secret";
const splash = (txt: string) => `Body splash Victoria's Secret, frasco de 250 ml. ${txt} Leve e refrescante, ideal para reaplicar ao longo do dia.`;
const shimmer = (txt: string) => `Body splash Victoria's Secret com partículas de brilho, frasco de 250 ml. ${txt} Perfuma e ilumina a pele com um glow delicado.`;
const kitVS = (name: string, txt: string) => `Kit Victoria's Secret ${name} com body splash + loção hidratante. ${txt} Use os dois juntos para a fragrância durar ainda mais na pele.`;
const scrub = (name: string, txt: string) => `Esfoliante corporal de açúcar Stella Dustin (Full Sugar Exfoliating Scrub) na fragrância ${name}. ${txt} Remove as células mortas e deixa a pele macia, lisa e perfumada.`;
const cream = (txt: string) => `Creme hidratante corporal perfumado. ${txt} Textura cremosa que hidrata e deixa a pele perfumada por horas.`;
const glow = (cor: string) => `Óleo corporal iluminador Stella Dustin (Shimmering Glow Oil) com partículas de brilho ${cor}. Hidrata intensamente e deixa a pele radiante — lindo no colo, nos ombros e nas pernas.`;
const kitGift = (brand: string, name: string, txt: string) => `Kit presente ${brand} ${name}, em embalagem especial. ${txt} Uma ótima opção para presentear ou completar a sua coleção.`;

// Cremes "Intense": textos ajustados conforme as embalagens das fotos enviadas pela loja.
const CREAM_INTENSE = {
  mango: {
    from: cream("Fragrância de manga madura, tropical e suculenta."),
    to: cream("Fragrância Mango Mandarin Tutti: manga madura com tangerina, tropical e suculenta."),
  },
  cherry: {
    from: cream("Fragrância de cereja doce e envolvente."),
    to: cream("Fragrância Japanese Cherry Blossom: flor de cerejeira, floral, delicada e envolvente."),
  },
  kiss: {
    from: cream("Fragrância doce e frutada, feminina e divertida."),
    to: cream("Fragrância Poisonous Kiss: doce e frutada, feminina e marcante."),
  },
};

/** Ajustes de descrição aplicados a lojas já criadas (só onde o texto não foi editado no painel). */
export const DESCRIPTION_FIXES = [
  { slug: "creme-mango-intense", ...CREAM_INTENSE.mango },
  { slug: "creme-cherry-intense", ...CREAM_INTENSE.cherry },
  { slug: "creme-kiss-intense", ...CREAM_INTENSE.kiss },
];

// Ajustes da lista enviada pela loja (aplicados em lojas já criadas só onde o produto não foi alterado no painel).
const CLUB_DE_NUIT = {
  from: "Um dos árabes mais desejados do mundo. Abre com limão, abacaxi e groselha preta, evolui para bétula defumada e jasmim e finaliza em almíscar, âmbar e patchouli. Fresco, marcante e com excelente projeção.",
  to: "Fragrância cítrica e amadeirada, com notas de abacaxi, limão e maçã. Marcante e sofisticada, ideal para homens que gostam de deixar sua presença marcada.",
};
export const PRODUCT_UPDATES_V3 = [
  {
    slug: "club-de-nuit-intense-man",
    fromPriceCents: 26000,
    priceCents: 22000,
    fromDescription: CLUB_DE_NUIT.from,
    description: CLUB_DE_NUIT.to,
  },
];

/** Seções que não aparecem na página inicial. Continuam na loja: menu, busca e página própria. */
export const OFF_HOME_CATEGORIES = ["cremes", "esfoliantes", "cabelos", "kits", "stella-dustin"];

// Descrições cujo final veio cortado na lista da loja e foram completadas.
const COMPLETED = {
  fada: {
    from: "Uma fragrância unissex para os que gostam de perfumes delicados, marcantes e cheios de personalidade. Ideal para deixar sua presença ainda mais especial.",
    to: "Uma fragrância unissex para os que gostam de perfumes delicados, marcantes e cheios de personalidade. Ideal para deixar sua presença ainda mais especial em qualquer ocasião.",
  },
  hype: {
    from: "Fragrância masculina cítrica e amadeirada, com notas de mandarina, pimenta rosa, cardamomo, cedro e musk.",
    to: "Fragrância masculina cítrica e amadeirada, com notas de mandarina, pimenta rosa, cardamomo, cedro e musk. Ideal para homens que gostam de perfumes modernos, marcantes e versáteis, para o dia a dia e para a noite.",
  },
  azure: {
    from: "Perfume unissex com notas de maçã, toranja, kiwi e tangerina, combinadas com flores, baunilha, âmbar e madeiras.",
    to: "Perfume unissex com notas de maçã, toranja, kiwi e tangerina, combinadas com flores, baunilha, âmbar e madeiras. Ideal para quem gosta de fragrâncias frescas, frutadas e elegantes, para usar em qualquer ocasião.",
  },
};
export const DESCRIPTION_FIXES_V4 = [
  { slug: "fada", ...COMPLETED.fada },
  { slug: "hype-for-men", ...COMPLETED.hype },
  { slug: "azure", ...COMPLETED.azure },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // ───────── Perfumes masculinos
  p(M, "", "Mussamam Black Intense", "Lattafa", 350, "Eau de parfum intenso e marcante da linha Musamam. Perfil amadeirado e especiado, com fundo ambarado e levemente adocicado. Presença forte, ideal para a noite e ocasiões especiais."),
  p(M, "", "Al Noble Ameer", "Lattafa", 250, "Da coleção Al Noble, um amadeirado ambarado sofisticado, com toque de especiarias e fundo quente e envolvente. Elegante, versátil e de ótima fixação."),
  p(M, "", "Al Noble Safeer", "Lattafa", 250, "Quente e sedutor, combina especiarias e baunilha sobre um fundo amadeirado e levemente licoroso. Uma fragrância de personalidade para a noite e os dias mais frios."),
  p(M, "", "Club de Nuit Intense Man", "Armaf", 220, CLUB_DE_NUIT.to, true),
  p(M, "", "Club de Nuit Elixir (Urban Man Elixir)", "Armaf", 300, "A versão intensa e especiada da linha Club de Nuit: lavanda e especiarias quentes sobre um fundo amadeirado e ambarado, com leve toque de alcaçuz. Potente e duradouro."),
  p(M, "", "Fakhar Black", "Lattafa", 230, "Aromático fresco e moderno: maçã, bergamota e gengibre na saída, lavanda e sálvia no coração e fundo de fava tonka, cedro e âmbar. Perfeito para o dia a dia e para o trabalho.", true),

  // ───────── Perfumes femininos
  p(F, "", "Rose Land", "J.K Paris", 160, "Floral delicado e romântico, com a rosa como protagonista e um fundo suave e levemente adocicado. Feminino e fácil de usar no dia a dia."),
  p(F, "", "Delilah Blanc", "Maison Alhambra", 250, "Floral frutado luminoso e sofisticado: frutas frescas na saída, rosa e peônia no coração e almíscar branco aveludado no fundo. Elegância com frescor.", true),
  p(F, "", "Mussamam White", "Lattafa", 350, "A versão clara da linha Musamam: cremosa, almiscarada e envolvente, com fundo quente e confortável. Um perfume chique, de excelente fixação."),
  p(F, "", "Yara Moi", "Lattafa", 230, "A Yara branca: jasmim e pêssego na saída, coração de caramelo e âmbar e fundo de sândalo e patchouli. Doce na medida, elegante e aconchegante."),
  p(F, "", "Victoria", "Lattafa", 230, "Floral frutado feminino e radiante, com saída suculenta, coração de flores e fundo macio e adocicado. Para quem gosta de perfumes alegres e elegantes."),
  p(F, "", "Sabah Sugar (Sabah Al Ward)", "Ard Al Zaafaran", 160, "Doce e floral, lembra rosas açucaradas com um fundo cremoso de baunilha e almíscar. Delicado, feminino e muito elogiado."),
  p(F, "", "Durrat Al Aroos", "Al Wataniah", 160, "“A pérola da noiva”: floral frutado doce e encantador, com frutas suculentas, flores brancas e fundo de baunilha e almíscar."),
  p(F, "", "Ameerati Gold", "Al Wataniah", 230, "Floral ambarado luminoso e sofisticado, com toque adocicado e fundo quente. Um perfume de princesa para ocasiões especiais."),
  p(F, "", "Yara Tradicional", "Lattafa", 230, "A queridinha da Lattafa: orquídea, heliotrópio e tangerina na saída, coração gourmand com frutas tropicais e fundo de baunilha, almíscar e sândalo. Cremosa, doce e viciante.", true),
  p(F, "", "Yara Elixir", "Lattafa", 260, "A versão mais intensa e concentrada da Yara: gourmand frutado, cremoso e envolvente, com fixação e projeção ainda maiores."),
  p(F, "", "Yara Tous", "Lattafa", 230, "A Yara tropical: manga, coco e maracujá na saída, flores brancas no coração e fundo de baunilha e almíscar. Solar, cremosa e deliciosa.", true),
  p(F, "", "Yara Candy", "Lattafa", 230, "Divertida e doce: tangerina verde e groselha preta, coração frutado e cintilante e fundo de baunilha, sândalo e almíscar. Um doce em forma de perfume.", true),
  p(F, "", "Afeef", "Lattafa", 450, "Alta perfumaria árabe em um frasco imponente. Fragrância sofisticada e marcante, de rastro elegante e longa duração, para quem gosta de exclusividade."),
  p(F, "", "24K Pure Gold", "Lonkoom", 160, "Floral frutado luminoso com fundo adocicado e ambarado, em um frasco dourado marcante. Glamour para o dia a dia."),
  p(F, "", "La Vita Glamour", "J.K Paris", 160, "Gourmand floral doce e envolvente, com frutas, flores e um fundo de baunilha e pralinê. Feminino, alegre e glamouroso."),
  p(F, "", "Velvet Garnet", "Stella Dustin", 160, "Frutado floral aveludado, com toque de frutas vermelhas e fundo macio e adocicado. Sensual e elegante."),
  p(F, "", "Mayar Natural (Natural Intense)", "Lattafa", 230, "Frutado floral fresco e vibrante: frutas suculentas, flores delicadas e um fundo limpo de almíscar. Leve, jovem e radiante."),
  p(F, "", "Ameerati Red (Ameerat Al Arab)", "Lattafa", 230, "A princesa das arábias em versão vermelha: floral frutado intenso e adocicado, feminino e marcante, com ótima fixação."),
  p(F, "", "Haya", "Lattafa", 260, "Frutado floral cintilante e sofisticado, com frutas vermelhas, flores brancas e fundo de baunilha e almíscar. Chique e moderno.", true),
  p(F, "", "Falkhar (Fakhar Lattafa)", "Lattafa", 230, "Floral branco elegante: frutas e aldeídos na saída, tuberosa, jasmim e ylang-ylang no coração e fundo de baunilha, sândalo e almíscar branco."),
  p(F, "", "Shagaf (Shagaf Al Ward)", "Al Wataniah", 230, "Floral rosado doce e delicado, com rosas, frutas e fundo aveludado de baunilha e almíscar. Romântico e muito feminino."),
  p(F, "", "Badee Al Oud Sublime", "Lattafa", 260, "Frutado floral marcante: maçã, lichia e rosa na saída, ameixa e jasmim no coração e fundo de baunilha, musgo e patchouli. Doce, vibrante e muito elogiado.", true),
  p(F, "", "Ameerati Sugar (Sugar Crown)", "Lattafa", 230, "A coroa açucarada da linha Ameerat Al Arab: doce, frutado e floral, com fundo de baunilha e almíscar. Para quem ama perfumes gourmand."),
  p(F, "", "Ameerati Prive Rose", "Asdaaf", 230, "A versão rosé da Ameerat Al Arab: floral frutado delicado, com rosas, frutas suaves e fundo almiscarado. Feminino e elegante."),
  p(F, "", "Tiramisū Caramel", "Zimaya", 230, "Gourmand irresistível inspirado na sobremesa italiana: notas doces de caramelo, café e baunilha em um fundo cremoso. Para quem ama perfumes “de comer”."),
  p(F, "", "Hayaati Florence", "Lattafa", 230, "Frutado floral luminoso e moderno, com saída fresca, coração de flores e fundo macio e levemente adocicado. Versátil para todas as horas."),
  p(F, "", "Hayaati Gold Elixir", "Lattafa", 230, "Dourado, quente e envolvente: um ambarado baunilhado com especiarias suaves e madeiras. Aconchegante e sofisticado, com ótima projeção."),
  p(F, "", "Sabah of Garden (Garden of Eden, Sabah Al Ward)", "Al Wataniah", 230, "Um jardim florido em frasco: floral frutado fresco e adocicado, com fundo suave de almíscar. Delicado e radiante."),
  p(F, "", "Vivecca", "Maryaj", 160, "Floral frutado feminino e alegre, com flores brancas e um fundo adocicado e confortável. Ótima escolha para o dia a dia."),
  p(F, "", "King of Arábia (Queen of Arabia)", "Lattafa Pride", 450, "Da linha de luxo Lattafa Pride: fragrância opulenta e sofisticada, com flores, especiarias e um fundo ambarado e almiscarado. Uma joia da perfumaria árabe."),

  // ───────── Body splash
  p(B, "Body Splash 250 ml", "Strawberries e Champagne", VS, 120, splash("Morango suculento e champanhe borbulhante: fresco, doce e festivo."), true),
  p(B, "Body Splash 250 ml", "Midnight Bloom Shimmer", VS, 120, shimmer("Floral frutado noturno e envolvente.")),
  p(B, "Body Splash 250 ml", "Midnight Bloom", VS, 120, splash("Floral frutado noturno, envolvente e sedutor.")),
  p(B, "Body Splash 250 ml", "Bare Vanilla", VS, 120, splash("Baunilha batida e cashmere macio: quente, cremoso e aconchegante."), true),
  p(B, "Body Splash 250 ml", "Velvet Petals", VS, 120, splash("Flores exuberantes e glacê de amêndoas: delicado, doce e floral.")),
  p(B, "Body Splash 250 ml", "Pure Seduction", VS, 120, splash("Ameixa vermelha e frésia: frutado, suculento e sedutor."), true),
  p(B, "Body Splash 250 ml", "Velvet Petals Shimmer", VS, 120, shimmer("Flores exuberantes e glacê de amêndoas.")),
  p(B, "Body Splash 250 ml", "Pure Seduction Shimmer", VS, 120, shimmer("Ameixa vermelha e frésia.")),
  p(B, "Kits Body Splash + Loção", "Kit Midnight Bloom Shimmer", VS, 230, kitVS("Midnight Bloom Shimmer", "Floral frutado noturno com brilho delicado.")),
  p(B, "Kits Body Splash + Loção", "Kit Midnight Bloom", VS, 230, kitVS("Midnight Bloom", "Floral frutado noturno e envolvente.")),
  p(B, "Kits Body Splash + Loção", "Kit Pure Seduction Shimmer", VS, 230, kitVS("Pure Seduction Shimmer", "Ameixa vermelha e frésia com brilho delicado.")),
  p(B, "Kits Body Splash + Loção", "Kit Pure Seduction", VS, 230, kitVS("Pure Seduction", "Ameixa vermelha e frésia, frutado e sedutor.")),
  p(B, "Kits Body Splash + Loção", "Kit Strawberries e Champagne", VS, 230, kitVS("Strawberries & Champagne", "Morango suculento e champanhe borbulhante.")),
  p(B, "Kits Body Splash + Loção", "Kit Bare Vanilla", VS, 230, kitVS("Bare Vanilla", "Baunilha batida e cashmere macio.")),
  p(B, "Kits Body Splash + Loção", "Kit Velvet Petals", VS, 230, kitVS("Velvet Petals", "Flores exuberantes e glacê de amêndoas.")),
  p(B, "Kits Stella Dustin", "Kit Serene Aura", "Stella Dustin", 110, "Kit Stella Dustin Serene Aura com body splash + body lotion. Uma fragrância suave e relaxante para perfumar e hidratar a pele todos os dias."),
  p(B, "Kits Stella Dustin", "Kit Radiant Aura", "Stella Dustin", 110, "Kit Stella Dustin Radiant Aura com body splash + body lotion. Uma fragrância luminosa e alegre para perfumar e hidratar a pele todos os dias."),

  // ───────── Creme corporal
  p(C, "", "Creme Yara", "", 55, cream("Na fragrância Yara: doce, cremosa e delicada, com toque de baunilha e frutas."), true),
  p(C, "", "Creme Sabah al Ward", "", 55, cream("Na fragrância Sabah Al Ward: floral adocicada, com rosas e baunilha.")),
  p(C, "", "Creme Asad Bourbon", "", 55, cream("Na fragrância Asad Bourbon: quente, baunilhada e levemente especiada.")),
  p(C, "", "Creme Asad", "", 55, cream("Na fragrância Asad: especiada, ambarada e marcante.")),
  p(C, "", "Creme Club de Nuit", "", 55, cream("Na fragrância Club de Nuit: fresca, frutada e levemente defumada.")),
  p(C, "", "Creme Mango Intense", "", 35, CREAM_INTENSE.mango.to),
  p(C, "", "Creme Cherry Intense", "", 35, CREAM_INTENSE.cherry.to),
  p(C, "", "Creme Kiss Intense", "", 35, CREAM_INTENSE.kiss.to),

  // ───────── Esfoliantes
  p(E, "", "Esfoliante Caipirinha (Passion Fruit Caipirinha)", "Stella Dustin", 80, scrub("Passion Fruit Caipirinha", "Maracujá cítrico e refrescante.")),
  p(E, "", "Esfoliante Pitaya (Pitaya Bowl)", "Stella Dustin", 80, scrub("Pitaya Bowl", "Pitaya frutada e tropical."), true),
  p(E, "", "Esfoliante Coconut (Coconut Cream Pie)", "Stella Dustin", 80, scrub("Coconut Cream Pie", "Coco cremoso e adocicado.")),
  p(E, "", "Esfoliante Candy Cane (Candy Cane Martini)", "Stella Dustin", 80, scrub("Candy Cane Martini", "Doce e mentolado, como um bastão de açúcar.")),
  p(E, "", "Esfoliante Mango (Mango Iced Tea)", "Stella Dustin", 80, scrub("Mango Iced Tea", "Manga com chá gelado, fresco e frutado.")),
  p(E, "", "Esfoliante Vanila (Vanilla Custard)", "Stella Dustin", 80, scrub("Vanilla Custard", "Creme de baunilha quente e aconchegante.")),
  p(E, "", "Esfoliante Ocean Breeze", "Stella Dustin", 80, scrub("Ocean Breeze", "Brisa do mar, fresca e limpa.")),
  p(E, "", "Esfoliante Watermelon (Watermelon Margarita)", "Stella Dustin", 80, scrub("Watermelon Margarita", "Melancia suculenta e refrescante.")),
  p(E, "", "Esfoliante Strawberry (Strawberry Daiquiri)", "Stella Dustin", 89, scrub("Strawberry Daiquiri", "Morango doce e vibrante.")),

  // ───────── Cabelos
  p(H, "Shampoo e Condicionador", "Kit Fino (shampoo 500 ml + condicionador 500 ml)", "Fino Premium Touch (Shiseido)", 280, "Dupla da linha japonesa Fino Premium Touch, da Shiseido, queridinha de quem tem cabelos danificados. Limpa com suavidade e devolve maciez, brilho e alinhamento aos fios.", true),
  p(H, "Shampoo e Condicionador", "Kit Fino (shampoo + condicionador + máscara)", "Fino Premium Touch (Shiseido)", 380, "Tratamento completo Fino Premium Touch, da Shiseido: shampoo, condicionador e a famosa máscara de tratamento intensivo. Fios nutridos, macios e com brilho de salão."),
  p(H, "Shampoo e Condicionador", "Kit Moisture Recovery (shampoo 1 litro + máscara 500 ml)", "Joico", 390, "Linha Moisture Recovery da Joico em tamanho profissional, para cabelos secos e ressecados. Hidratação profunda, maciez e elasticidade."),
  p(H, "Shampoo e Condicionador", "Kit Hydra Splash (shampoo + condicionador)", "Joico", 200, "Dupla Joico Hydra Splash: hidratação leve para cabelos finos a médios, que deixa os fios macios e soltos, sem pesar."),
  p(H, "Shampoo e Condicionador", "Kit Recovery (shampoo + condicionador)", "Joico", 200, "Dupla de shampoo e condicionador Joico para recuperar a hidratação e a maciez dos fios no dia a dia."),
  p(H, "Karseell", "Kit Karseell Shampoo e condicionador", "Karseell", 170, "Shampoo e condicionador Karseell com colágeno: limpeza suave e fios mais macios, alinhados e com brilho.", true),
  p(H, "Karseell", "Kit Karseell mini (shampoo, condicionador e máscara)", "Karseell", 70, "Versão mini da rotina Karseell com shampoo, condicionador e máscara. Perfeita para viagem ou para conhecer a linha."),
  p(H, "Karseell", "Kit Karseell máscara e óleo", "Karseell", 130, "A máscara de colágeno Karseell com o óleo finalizador: tratamento profundo, brilho e controle do frizz."),
  p(H, "Karseell", "Óleo Karseell", "Karseell", 60, "Óleo capilar finalizador Karseell: brilho, maciez e pontas seladas, com controle do frizz."),
  p(H, "Karseell", "Máscara Purple Karseell", "Karseell", 50, "Máscara matizadora roxa Karseell para cabelos loiros e grisalhos: neutraliza os tons amarelados enquanto trata os fios."),
  p(H, "Karseell", "Máscara Collagen Karseell", "Karseell", 50, "A famosa máscara de colágeno da Karseell: tratamento profundo para cabelos secos e danificados, com maciez imediata."),
  p(H, "Karseell", "Kit Karseell shampoo, máscara e óleo", "Karseell", 260, "Rotina Karseell com shampoo, máscara de colágeno e óleo finalizador para limpar, tratar e finalizar os fios."),
  p(H, "Tsubaki", "Kit Tsubaki shampoo 450 ml e condicionador 450 ml", "Tsubaki", 260, "Dupla da linha japonesa Tsubaki, com óleo de camélia: cabelos brilhantes, macios e nutridos da raiz às pontas.", true),
  p(H, "Secador", "Secador Taiff profissional (Style 2000W)", "Taiff", 250, "Secador profissional Taiff Style com 2000W de potência: secagem rápida e acabamento de salão em casa."),

  // ───────── Stella Dustin
  p(S, "Kits", "Kit Stella Dustin Self Legend", "Stella Dustin", 300, kitGift("Stella Dustin", "Self Legend", "Uma seleção de cuidados perfumados da marca.")),
  p(S, "Kits", "Kit Stella Dustin Camellia", "Stella Dustin", 300, kitGift("Stella Dustin", "Camellia", "Uma seleção de cuidados perfumados com a delicadeza da camélia.")),
  p(S, "Kits", "Kit Stella Dustin Lumina White", "Stella Dustin", 300, kitGift("Stella Dustin", "Lumina White", "Uma seleção de cuidados perfumados, luminosa e elegante.")),
  p(S, "Banho", "Espuma de banho Stella Dustin (Shower Shake)", "Stella Dustin", 40, "Espuma de banho perfumada Stella Dustin Shower Shake: textura leve e cremosa que limpa e perfuma a pele."),
  p(S, "Glow Corporal", "Glow corporal rose", "Stella Dustin", 60, glow("rosé")),
  p(S, "Glow Corporal", "Glow corporal red", "Stella Dustin", 60, glow("avermelhado"), true),
  p(S, "Glow Corporal", "Glow corporal silver", "Stella Dustin", 60, glow("prateado")),
  p(S, "Glow Corporal", "Glow corporal shimmering", "Stella Dustin", 60, glow("dourado")),

  // ───────── Kits presente
  p(K, "Lattafa", "Kit Lattafa Fakhar Black", "Lattafa", 400, kitGift("Lattafa", "Fakhar Black", "Aromático fresco e moderno, com maçã, lavanda e fava tonka."), true),
  p(K, "Lattafa", "Kit Lattafa Badee Al Oud Blush", "Lattafa", 300, kitGift("Lattafa", "Badee Al Oud Blush", "Floral adocicado e elegante da linha Badee Al Oud.")),
  p(K, "Lattafa", "Kit Lattafa Haya", "Lattafa", 300, kitGift("Lattafa", "Haya", "Frutado floral cintilante e sofisticado."), true),
  p(K, "Lattafa", "Kit Lattafa mini Yara", "Lattafa", 130, "Kit Lattafa da linha Yara em versão mini: ideal para levar na bolsa, viajar ou presentear.", true),
  p(K, "Lattafa", "Kit Lattafa The Kingdom", "Lattafa", 300, kitGift("Lattafa", "The Kingdom", "Fragrância marcante e sofisticada.")),
  p(K, "Lattafa", "Kit Lattafa King of Arábia", "Lattafa", 300, kitGift("Lattafa", "King of Arábia", "Fragrância opulenta da perfumaria árabe.")),
  p(K, "Lattafa", "Kit Lattafa Nebras", "Lattafa", 300, kitGift("Lattafa", "Nebras", "Gourmand quente e envolvente, com frutas vermelhas, cacau e baunilha.")),
  p(K, "Lattafa", "Kit Lattafa Badee Al Oud Sublime", "Lattafa", 300, kitGift("Lattafa", "Badee Al Oud Sublime", "Frutado floral marcante, com maçã, lichia e rosa.")),
  p(K, "Ameerat", "Kit Ameerati Red", "Ameerat", 300, kitGift("Ameerat", "Ameerati Red", "Floral frutado intenso e adocicado.")),

  // ───────── Novos masculinos (lista e textos enviados pela loja)
  p(M, "", "Asad Bourbon", "Lattafa", 260, "Fragrância quente e marcante, com notas de cacau, especiarias e baunilha bourbon. Um aroma doce e envolvente, perfeito para quem gosta de deixar sua presença marcada."),
  p(M, "", "Kit The Kingdom", "Lattafa", 300, "Fragrância doce e marcante, com notas de lavanda, baunilha e tabaco. Sofisticada e envolvente, ideal para homens que gostam de aromas intensos e elegantes."),
  p(M, "", "Asad Zanzibar Edição Limitada", "Lattafa", 260, "Fragrância fresca, cremosa e envolvente, com notas de água de coco, lavanda e baunilha. Ideal para homens que gostam de aromas exóticos, marcantes e sofisticados."),
  p(M, "", "Kit Self Legends", "Stella Dustin", 300, "Perfume masculino de fragrância marcante, sofisticada e amadeirada, ideal para homens que gostam de aromas intensos, elegantes e que se destacam."),
  p(M, "", "Fada", "Stella Dustin", 260, COMPLETED.fada.to),
  p(M, "", "24 Carat Pure Gold", "", 150, "Fragrância compartilhável para homens e mulheres que gostam de perfumes intensos, quentes e sofisticados, com notas de oud, açafrão, rosa, âmbar e baunilha."),
  // Preço 0 = "Preço sob consulta" (a loja ainda não informou o valor).
  p(M, "", "Asad Elixir", "Lattafa", 0, "Perfume masculino intenso e sofisticado, com notas de pimenta rosa, açafrão, toranja, tabaco, baunilha e madeiras. Ideal para homens que gostam de fragrâncias fortes, elegantes e marcantes."),
  p(M, "", "Asad Black", "Lattafa", 220, "Perfume masculino intenso, com notas de pimenta-preta, abacaxi, tabaco, café e baunilha. Uma fragrância marcante, quente e amadeirada, ideal para homens que gostam de perfumes fortes, sofisticados e envolventes. Perfeito para noites e ocasiões especiais."),
  p(M, "", "Shiro", "Ajmal", 220, "Fresca, cítrica e amadeirada, com notas de limão, maçã, toque marinho, cedro, âmbar e musk. Ideal para homens que gostam de perfumes refrescantes, elegantes e versáteis, perfeitos para o dia a dia."),
  p(M, "", "Hype For Men", "", 150, COMPLETED.hype.to),
  p(M, "", "Azure", "Lonkoom", 220, COMPLETED.azure.to),
];

/** Quantos produtos do fim da lista entraram na versão 3 dos dados (novos masculinos). */
export const SEED_V3_COUNT = 11;

// Temas da página inicial, na ordem do menu. As imagens 1 a 4 foram enviadas pela loja.
export const DEFAULT_BANNERS = [
  { image: "/banners/4.jpg", href: "/categoria/masculinos", label: "Perfumes Masculinos" },
  { image: "/banners/2.jpg", href: "/categoria/femininos", label: "Perfumes Femininos" },
  { image: "/banners/1.jpg", href: "/categoria/body-splash", label: "Body Splash" },
  { image: "/banners/cremes.jpg", href: "/categoria/cremes", label: "Creme Corporal" },
  { image: "/banners/esfoliantes.jpg", href: "/categoria/esfoliantes", label: "Esfoliantes" },
  { image: "/banners/cabelos.jpg", href: "/categoria/cabelos", label: "Cabelos" },
  { image: "/banners/3.jpg", href: "/categoria/cabelos?linha=Tsubaki", label: "Tsubaki" },
  { image: "/banners/kits.jpg", href: "/categoria/kits", label: "Kits Presente" },
  { image: "/banners/stella-dustin.jpg", href: "/categoria/stella-dustin", label: "Stella Dustin" },
];

// Topo da página inicial, em tela cheia: primeiro os dois vídeos e, quando eles terminam, as três fotos.
// Depois da última foto, volta para o primeiro vídeo. Cada destaque leva à seção ou ao produto dele.
// Nos vídeos, "image" é a cena que aparece enquanto o vídeo carrega.
export const DEFAULT_SLIDES = [
  {
    image: "/video/topo-masculino.jpg",
    video: "/video/topo-masculino.mp4",
    href: "/categoria/masculinos",
    label: "Perfumes Masculinos",
  },
  {
    image: "/video/topo-feminino.jpg",
    video: "/video/topo-feminino.mp4",
    href: "/categoria/femininos",
    label: "Perfumes Femininos",
  },
  { image: "/banners/destaque-1.jpg", href: "/produto/club-de-nuit-intense-man", label: "Club de Nuit Intense Man" },
  { image: "/banners/destaque-2.jpg", href: "/produto/victoria", label: "Victoria" },
  { image: "/banners/destaque-3.jpg", href: "/produto/al-noble-safeer", label: "Al Noble Safeer" },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: "Perfumes Imports",
  announcement: "Frete fixo R$ 14,00 via J3Flex · Entrega em até 2 dias úteis · Pague com Pix · Atendimento pelo WhatsApp",
  whatsappNumber: "5511973960316",
  notifyNumber: "5511973960316",
  callmebotKey: "",
  pixKey: "izabelly-santana@jim.com",
  pixName: "Izabelly Santana",
  pixCity: "Jandira",
  shippingCents: "1400",
  shippingDays: "2",
  maxInstallments: "12",
  interestFree: "1",
  pickupEnabled: "1",
  photosRepo: "deciomararaujo-rgb/portfolio",
  banners: JSON.stringify(DEFAULT_BANNERS),
  slides: JSON.stringify(DEFAULT_SLIDES),
};
