import type { CategoryContent } from '@/lib/category-content'

// Den engelska versionen av det redaktionella innehållet i category-content.ts.
// Strukturen och nycklarna är desamma; ändrar du en text där, ändra den här.
// Prisspannen anges i SEK eftersom de speglar svenska marknadsnivåer.
export const CONTENT_EN: Record<string, CategoryContent> = {
  webbutveckling: {
    heading: 'Find a web developer for your business',
    description:
      'Compare quotes from Swedish web developers. Describe what you need, get proposals and choose for yourself. Free to post a request.',
    intro:
      'Do you need a new website, a web shop or help building on something that already exists? Describe the request once and several developers can send concrete quotes for it.',
    examples: [
      'New website with a contact form and price list',
      'Web shop with payments and shipping options',
      'Booking system connected to a calendar',
      'Moving an existing site to a modern platform',
      'Ongoing maintenance, updates and security fixes',
    ],
    priceGuide: [
      { label: 'Simple website, a few pages', range: 'SEK 15,000–40,000' },
      { label: 'Website with booking or login', range: 'SEK 40,000–120,000' },
      { label: 'Web shop', range: 'SEK 50,000–200,000' },
      { label: 'Ongoing maintenance', range: 'SEK 1,000–5,000/month' },
    ],
    faq: [
      {
        q: 'What does it cost to build a website?',
        a: 'It depends on the scope. A simple site with a few subpages usually lands between SEK 15,000 and 40,000, while a site with booking, login or e-commerce costs more. The safest way to get a realistic price is to describe the need and compare several quotes.',
      },
      {
        q: 'How long does a web project take?',
        a: 'A simple website often takes two to four weeks from start to launch. Larger projects with integrations take longer. The schedule depends a lot on how quickly you can deliver texts and images yourselves.',
      },
      {
        q: 'What should I prepare before collecting quotes?',
        a: 'Write down what the site should do, who it is for and whether anything must be included, such as booking or payment. If you have an existing site, link to it. The clearer the description, the more comparable the quotes will be.',
      },
    ],
  },
  design: {
    heading: 'Find a graphic designer',
    description:
      'Compare quotes from Swedish designers for logos, brand identity and graphic design. Describe the request and get proposals.',
    intro:
      'Do you need a logo, a brand identity or material for print and social media? Describe what you need and designers can quote on exactly that.',
    examples: [
      'Logo and a basic brand identity',
      'Colours, typefaces and document templates',
      'Design of printed material and signage',
      'Images adapted for social media',
      'Interface design ahead of a web project',
    ],
    priceGuide: [
      { label: 'Logo', range: 'SEK 5,000–25,000' },
      { label: 'Brand identity', range: 'SEK 15,000–60,000' },
      { label: 'Printed material, each', range: 'SEK 2,000–10,000' },
      { label: 'Design system for the web', range: 'SEK 25,000–80,000' },
    ],
    faq: [
      {
        q: 'What does a logo cost?',
        a: 'Often between SEK 5,000 and 25,000. The difference lies in how many proposals are produced, how much research is included and whether you also get a brand identity with colours and typefaces.',
      },
      {
        q: 'Do I own the design afterwards?',
        a: 'It should be stated in the agreement. Settle the rights before the work starts and ask for the original files on delivery, not just exported images.',
      },
      {
        q: 'How many proposals are usually included?',
        a: 'Typically two to three directions, followed by a couple of rounds of adjustments on the one you choose. Ask the designer to state the number of rounds in the quote, so you avoid discussion later.',
      },
    ],
  },
  marknadsforing: {
    heading: 'Find help with digital marketing',
    description:
      'Compare quotes for SEO, advertising and social media. Describe your goal and get proposals from Swedish specialists.',
    intro:
      'Do you want to rank better in search, get started with advertising or get your social channels in order? Describe the goal and specialists can propose how they would work.',
    examples: [
      'Search engine optimisation to show up on Google',
      'Advertising through Google Ads or Meta',
      'Ongoing content for social media',
      'Newsletters and email campaigns',
      'Analysis and follow-up of results',
    ],
    priceGuide: [
      { label: 'SEO review, one-off', range: 'SEK 8,000–30,000' },
      { label: 'Ongoing SEO', range: 'SEK 5,000–25,000/month' },
      { label: 'Ad management', range: 'SEK 3,000–15,000/month' },
      { label: 'Social media, ongoing', range: 'SEK 5,000–20,000/month' },
    ],
    faq: [
      {
        q: 'How quickly does marketing deliver results?',
        a: 'Advertising brings traffic immediately but costs for as long as it runs. Search engine optimisation usually takes three to six months before it shows clearly, but the effect lasts longer. Be sceptical of anyone who promises quick top rankings.',
      },
      {
        q: 'What does the ad budget cost on top of the fee?',
        a: 'The specialist’s fee and the money for Google or Meta are two separate costs. Always check what the quote includes, so you do not count on a budget that only covers the work.',
      },
      {
        q: 'How do I know it works?',
        a: 'Agree on what to measure before the work starts: visitors, enquiries or sales. Ask for ongoing reporting against exactly those measures.',
      },
    ],
  },
  redovisning: {
    heading: 'Find a bookkeeper or accounting consultant',
    description:
      'Compare quotes from Swedish accounting consultants for ongoing bookkeeping, year-end accounts and tax returns.',
    intro:
      'Do you need help with ongoing bookkeeping, VAT reporting or year-end accounts? Describe the size and needs of the company and consultants can send quotes.',
    examples: [
      'Ongoing bookkeeping every month',
      'VAT returns and employer returns',
      'Year-end accounts and annual report',
      'Payroll',
      'Advice ahead of starting a company or expanding',
    ],
    priceGuide: [
      { label: 'Ongoing bookkeeping, smaller company', range: 'SEK 800–3,000/month' },
      { label: 'Payroll, per employee', range: 'SEK 150–400/month' },
      { label: 'Year-end accounts and annual report', range: 'SEK 8,000–25,000' },
      { label: 'Tax return, sole trader', range: 'SEK 3,000–8,000' },
    ],
    faq: [
      {
        q: 'What does a bookkeeper cost for a small business?',
        a: 'For a smaller limited company with a limited number of vouchers, ongoing bookkeeping is often between SEK 800 and 3,000 a month. The price depends on the number of transactions and whether payroll is included.',
      },
      {
        q: 'Does the consultant need to be authorised?',
        a: 'There is no legal requirement for bookkeeping, but authorisation through SRF or FAR means requirements for training and liability insurance. Ask about it if you want that assurance.',
      },
      {
        q: 'Can the bookkeeping be done remotely?',
        a: 'Yes, that is now the norm. Documents are sent digitally and the work is done in cloud-based systems such as Fortnox or Visma. You do not need the consultant to be in the same town.',
      },
    ],
  },
  juridik: {
    heading: 'Find legal help with contracts',
    description:
      'Compare quotes from lawyers for contracts, terms and commercial legal advice for businesses.',
    intro:
      'Do you need a contract reviewed, general terms drafted or advice ahead of a deal? Describe the matter and lawyers can send proposals.',
    examples: [
      'Customer and supplier agreements',
      'General terms for a website or service',
      'Employment and consulting agreements',
      'Privacy policy and GDPR review',
      'Shareholders’ agreements and company matters',
    ],
    priceGuide: [
      { label: 'Review of an existing contract', range: 'SEK 3,000–12,000' },
      { label: 'New contract from scratch', range: 'SEK 8,000–30,000' },
      { label: 'General terms', range: 'SEK 5,000–20,000' },
      { label: 'Ongoing advice', range: 'SEK 1,500–3,500/hour' },
    ],
    faq: [
      {
        q: 'What does it cost to have a contract reviewed?',
        a: 'A review of an existing contract with written comments is often between SEK 3,000 and 12,000, depending on the length and complexity of the contract.',
      },
      {
        q: 'Is a contract template enough?',
        a: 'A template can work for simple, recurring situations, but it does not take your specific deal into account. For larger values or longer commitments it is usually worth having a lawyer adapt it.',
      },
      {
        q: 'What applies to GDPR for a small business?',
        a: 'If you process personal data, such as customer details or newsletter subscribers, the rules apply to you regardless of size. You need to be able to account for what data you hold, why, and how long it is kept.',
      },
    ],
  },
  text: {
    heading: 'Find a copywriter or translator',
    description:
      'Compare quotes from Swedish writers and translators for web copy, articles and translation.',
    intro:
      'Do you need copy for your website, articles that show up in search or translation into other languages? Describe the request and writers can send quotes.',
    examples: [
      'Copy for the website’s subpages',
      'Articles and blog posts optimised for search',
      'Product descriptions for a web shop',
      'Translation between Swedish and English',
      'Proofreading of existing material',
    ],
    priceGuide: [
      { label: 'Web copy, per page', range: 'SEK 1,500–6,000' },
      { label: 'Article, 800–1,200 words', range: 'SEK 2,500–8,000' },
      { label: 'Translation, per word', range: 'SEK 1.50–3.50' },
      { label: 'Proofreading, per hour', range: 'SEK 600–1,200' },
    ],
    faq: [
      {
        q: 'What does web copy cost?',
        a: 'Often between SEK 1,500 and 6,000 per page depending on how much research is needed and whether the text should be optimised for search. Many writers prefer a fixed price per assignment to being paid per word.',
      },
      {
        q: 'What is the difference between copywriting and translation?',
        a: 'A copywriter writes new text based on your message and your audience. A translator carries existing text over into another language. For a text to work just as well in a new language it often needs adapting, not just direct translation.',
      },
      {
        q: 'Can the writer work from our tone of voice?',
        a: 'Yes. Include examples of texts you think work and describe how you want to be perceived. Most writers want that material before they start.',
      },
    ],
  },
  'foto-video': {
    heading: 'Find a photographer or video producer',
    description:
      'Compare quotes from Swedish photographers and video producers for company photos, product photography and film.',
    intro:
      'Do you need photos of the team, product photos for the web shop or a short film? Describe the request and photographers and filmmakers can send quotes.',
    examples: [
      'Portraits and environment shots for the website',
      'Product photography for a web shop',
      'Short company film or presentation video',
      'Filming of events',
      'Editing of existing material',
    ],
    priceGuide: [
      { label: 'Half-day shoot', range: 'SEK 5,000–12,000' },
      { label: 'Full-day shoot', range: 'SEK 10,000–25,000' },
      { label: 'Product photo, per image', range: 'SEK 200–800' },
      { label: 'Short company film', range: 'SEK 20,000–80,000' },
    ],
    faq: [
      {
        q: 'What does a photographer cost per day?',
        a: 'A full day is often between SEK 10,000 and 25,000 including post-processing. Check how many finished images are included, as it varies a lot between photographers.',
      },
      {
        q: 'Can we use the images however we like?',
        a: 'Not automatically. Copyright stays with the photographer unless otherwise agreed. Agree on the use in advance, especially if the images will be used in advertising.',
      },
      {
        q: 'How long does post-processing take?',
        a: 'Allow one to three weeks for photos and longer for film. Ask for a delivery time in writing, especially if the material will be used for a campaign with a fixed date.',
      },
    ],
  },
  'it-support': {
    heading: 'Find IT support and technical help',
    description:
      'Compare quotes from Swedish IT consultants for support, networks, security and cloud services.',
    intro:
      'Do you need ongoing IT support, help with security or a move to the cloud? Describe your situation and consultants can propose a solution.',
    examples: [
      'Ongoing support for the office',
      'Setting up computers and accounts',
      'Network, firewall and wifi',
      'Backup and recovery',
      'Moving to Microsoft 365 or Google Workspace',
    ],
    priceGuide: [
      { label: 'Support agreement, per user', range: 'SEK 300–900/month' },
      { label: 'Hourly support', range: 'SEK 900–1,600/hour' },
      { label: 'Workstation setup', range: 'SEK 2,000–6,000' },
      { label: 'Security review', range: 'SEK 10,000–40,000' },
    ],
    faq: [
      {
        q: 'What does IT support cost for a small office?',
        a: 'A support agreement is often between SEK 300 and 900 per user per month. Hourly help costs more per occasion but can be more reasonable if the need is rare.',
      },
      {
        q: 'How quickly do we get help when something breaks?',
        a: 'It is governed by the response time in the agreement. Ask about it before you sign, and check whether it applies to all cases or only those that stop operations.',
      },
      {
        q: 'Do we need our own server?',
        a: 'For most smaller businesses cloud services are enough, as they need less maintenance and have backup built in. An own server may be needed for special storage requirements or systems that are not available in the cloud.',
      },
    ],
  },
  affarsstod: {
    heading: 'Find administrative help and business support',
    description:
      'Compare quotes from Swedish consultants for administration, customer service, project management and business support.',
    intro:
      'Do you need relief with administration, customer contact or project management? Describe what takes time today and consultants can propose a set-up.',
    examples: [
      'Ongoing administration and invoicing',
      'Customer service by email and phone',
      'Project management of a defined assignment',
      'Research and background for decisions',
      'Getting systems and routines in order',
    ],
    priceGuide: [
      { label: 'Administrative help, per hour', range: 'SEK 400–900' },
      { label: 'Customer service, ongoing', range: 'SEK 5,000–20,000/month' },
      { label: 'Project management, per hour', range: 'SEK 800–1,500' },
      { label: 'Defined investigation assignment', range: 'SEK 10,000–50,000' },
    ],
    faq: [
      {
        q: 'What does administrative help cost?',
        a: 'Often between SEK 400 and 900 an hour depending on how specialised the task is. Many consultants offer a monthly arrangement with a set number of hours, which is cheaper per hour.',
      },
      {
        q: 'Is it worth it compared with hiring?',
        a: 'For a need that varies or is below half-time, a consultant is usually both cheaper and simpler. If the need is steady and amounts to full-time, employment is normally more economical.',
      },
      {
        q: 'How do we get started?',
        a: 'Start with a defined assignment so you can see how the collaboration works before you expand. Describe what takes the most time today and the consultant can suggest where the relief makes the most difference.',
      },
    ],
  },
}
