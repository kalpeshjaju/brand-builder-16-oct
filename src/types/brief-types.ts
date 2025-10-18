// Agency Brief Types - Professional creative briefs for agencies

/**
 * Complete agency brief package
 */
export interface AgencyBrief {
  brandName: string;
  generatedAt: string;
  brandIdentity: BrandIdentityBrief;
  visualGuidelines: VisualGuidelines;
  assetSpecifications: AssetSpecifications;
  messagingFramework: MessagingFramework;
  executionGuidance: ExecutionGuidance;
}

/**
 * Brand identity brief section
 */
export interface BrandIdentityBrief {
  overview: {
    purpose: string;
    mission: string;
    vision: string;
    essence: string; // One-sentence brand essence
  };
  positioning: {
    statement: string;
    targetAudience: string;
    competitors: string[];
    differentiation: string[];
    valueProposition: string;
  };
  personality: {
    traits: string[];
    archetype?: string;
    humanAnalogy?: string; // "If this brand were a person..."
  };
  values: {
    core: string[];
    behaviors: string[]; // How values manifest in actions
  };
}

/**
 * Visual guidelines specification
 */
export interface VisualGuidelines {
  colorPalette: ColorPaletteSpec;
  typography: TypographySpec;
  logoGuidelines: LogoGuidelines;
  imagery: ImageryGuidance;
  designPrinciples: string[];
  doAndDonts: {
    do: string[];
    dont: string[];
  };
}

/**
 * Color palette specification
 */
export interface ColorPaletteSpec {
  primary: ColorSpec[];
  secondary: ColorSpec[];
  neutral: ColorSpec[];
  accent: ColorSpec[];
  guidance: {
    primaryUse: string;
    secondaryUse: string;
    combinations: string[];
    accessibility: string;
  };
}

/**
 * Single color specification
 */
export interface ColorSpec {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  pantone?: string;
  usage: string;
  emotion?: string; // What feeling this color evokes
}

/**
 * Typography specification
 */
export interface TypographySpec {
  primaryFont: FontSpec;
  secondaryFont?: FontSpec;
  headingHierarchy: {
    h1: TypographyStyle;
    h2: TypographyStyle;
    h3: TypographyStyle;
    h4: TypographyStyle;
  };
  bodyText: TypographyStyle;
  guidance: {
    pairing: string;
    sizing: string;
    spacing: string;
    accessibility: string;
  };
}

/**
 * Font specification
 */
export interface FontSpec {
  name: string;
  family: string;
  weights: number[];
  styles: string[]; // regular, italic, etc.
  source: string; // Google Fonts, Adobe Fonts, custom
  fallbacks: string[];
  usage: string;
  personality: string;
}

/**
 * Typography style
 */
export interface TypographyStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: string;
}

/**
 * Logo guidelines
 */
export interface LogoGuidelines {
  variations: LogoVariation[];
  clearSpace: string;
  minimumSize: {
    print: string;
    digital: string;
  };
  placement: string[];
  incorrectUsage: string[];
  fileFormats: {
    vector: string[]; // SVG, AI, EPS
    raster: string[]; // PNG, JPG
    sizes: string[];
  };
}

/**
 * Logo variation
 */
export interface LogoVariation {
  name: string;
  description: string;
  usage: string;
  formats: string[];
  colorMode: 'full-color' | 'monochrome' | 'reverse' | 'grayscale';
}

/**
 * Imagery guidance
 */
export interface ImageryGuidance {
  style: string;
  subjects: string[];
  composition: string[];
  mood: string[];
  filters: string[];
  avoid: string[];
  examples: {
    description: string;
    reasoning: string;
  }[];
}

/**
 * Asset specifications
 */
export interface AssetSpecifications {
  digital: DigitalAssetSpecs;
  print: PrintAssetSpecs;
  social: SocialMediaSpecs;
  marketing: MarketingAssetSpecs;
  deliverables: DeliverableSpec[];
}

/**
 * Digital asset specifications
 */
export interface DigitalAssetSpecs {
  website: {
    logo: AssetSize[];
    favicon: AssetSize[];
    ogImage: AssetSize[];
    heroImages: AssetSize[];
  };
  email: {
    headerLogo: AssetSize[];
    emailWidth: string;
    imageSpecs: AssetSize[];
  };
  display: {
    bannerSizes: AssetSize[];
    videoSpecs: VideoSpec[];
  };
}

/**
 * Print asset specifications
 */
export interface PrintAssetSpecs {
  businessCards: {
    size: string;
    bleed: string;
    resolution: string;
    colorMode: string;
  };
  letterhead: {
    size: string;
    margins: string;
    resolution: string;
  };
  brochures: {
    sizes: string[];
    folds: string[];
    resolution: string;
  };
  packaging?: {
    types: string[];
    materials: string[];
    printing: string;
  };
}

/**
 * Social media specifications
 */
export interface SocialMediaSpecs {
  profileImages: {
    platform: string;
    size: string;
    format: string;
  }[];
  coverImages: {
    platform: string;
    size: string;
    format: string;
  }[];
  postSizes: {
    platform: string;
    square: string;
    landscape: string;
    portrait: string;
    stories: string;
  }[];
  videoSpecs: {
    platform: string;
    maxDuration: string;
    aspectRatio: string;
    resolution: string;
  }[];
}

/**
 * Marketing asset specifications
 */
export interface MarketingAssetSpecs {
  presentations: {
    slides: string[];
    templates: string[];
  };
  documents: {
    templates: string[];
    styles: string[];
  };
  promotional: {
    items: string[];
    specifications: string[];
  };
}

/**
 * Single asset size specification
 */
export interface AssetSize {
  name: string;
  dimensions: string;
  format: string;
  resolution?: string;
  colorSpace?: string;
  purpose: string;
}

/**
 * Video specification
 */
export interface VideoSpec {
  name: string;
  duration: string;
  aspectRatio: string;
  resolution: string;
  frameRate: string;
  codec: string;
  format: string;
}

/**
 * Deliverable specification
 */
export interface DeliverableSpec {
  id: string;
  name: string;
  category: 'identity' | 'digital' | 'print' | 'social' | 'marketing';
  priority: 'critical' | 'high' | 'medium' | 'low';
  format: string[];
  specifications: string;
  timeline: string;
  dependencies: string[];
}

/**
 * Messaging framework
 */
export interface MessagingFramework {
  voice: {
    description: string;
    attributes: string[];
    examples: VoiceExample[];
  };
  tone: {
    situations: ToneSituation[];
    guidelines: string[];
  };
  keyMessages: {
    primary: string[];
    secondary: string[];
    proofPoints: string[];
  };
  taglines: {
    primary?: string;
    alternatives: string[];
    usage: string;
  };
  boilerplate: {
    short: string; // 50 words
    medium: string; // 100 words
    long: string; // 200 words
  };
}

/**
 * Voice example
 */
export interface VoiceExample {
  context: string;
  good: string;
  bad: string;
  reasoning: string;
}

/**
 * Tone situation
 */
export interface ToneSituation {
  situation: string;
  tone: string;
  example: string;
}

/**
 * Execution guidance
 */
export interface ExecutionGuidance {
  websiteGuidance: {
    homepage: string[];
    navigation: string[];
    contentStrategy: string[];
    ux: string[];
  };
  contentGuidance: {
    blogPosts: string[];
    socialMedia: string[];
    emailMarketing: string[];
    video: string[];
  };
  campaignGuidance: {
    launch: string[];
    ongoing: string[];
    seasonal: string[];
  };
  partnershipGuidance: {
    cobranding: string[];
    sponsorships: string[];
    collaborations: string[];
  };
}

/**
 * Brief generation options
 */
export interface BriefGenerationOptions {
  includeExamples?: boolean;
  includeTemplates?: boolean;
  detailLevel?: 'essential' | 'standard' | 'comprehensive';
  format?: 'json' | 'pdf' | 'html' | 'markdown';
  customSections?: string[];
}
