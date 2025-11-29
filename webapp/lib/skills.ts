import fs from 'node:fs';
import path from 'node:path';
// TODO: Implement Drive templates integration
// import { loadSkillTemplatesFromDrive } from './templates-drive';

export interface SkillContext {
  name: string;
  description: string;
  skillContent: string;
  references: Record<string, string>;
  useDriveTemplates?: boolean; // Flag to indicate if templates are from Drive
}

/**
 * Load a skill and all its reference materials from filesystem
 */
export function loadSkill(skillName: string): SkillContext | null {
  try {
    const skillPath = path.join(process.cwd(), '..', 'skills', skillName);

    // Check if skill exists
    if (!fs.existsSync(skillPath)) {
      console.error(`Skill not found: ${skillName}`);
      return null;
    }

    // Load main SKILL.md file
    const skillFilePath = path.join(skillPath, 'SKILL.md');
    const skillContent = fs.readFileSync(skillFilePath, 'utf-8');

    // Load all reference files
    const references: Record<string, string> = {};
    const referencesPath = path.join(skillPath, 'references');

    if (fs.existsSync(referencesPath)) {
      const referenceFiles = fs.readdirSync(referencesPath);

      for (const file of referenceFiles) {
        if (file.endsWith('.md')) {
          const filePath = path.join(referencesPath, file);
          const fileName = file.replace('.md', '');
          references[fileName] = fs.readFileSync(filePath, 'utf-8');
        }
      }
    }

    return {
      name: skillName,
      description: extractDescription(skillContent),
      skillContent,
      references,
      useDriveTemplates: false,
    };
  } catch (error) {
    console.error(`Error loading skill ${skillName}:`, error);
    return null;
  }
}

/**
 * Load a skill with templates from Google Drive instead of filesystem
 * This allows users to edit templates in Google Docs
 */
export async function loadSkillWithDriveTemplates(skillName: string): Promise<SkillContext | null> {
  try {
    // Load the main skill file from filesystem (SKILL.md)
    const skillPath = path.join(process.cwd(), '..', 'skills', skillName);

    if (!fs.existsSync(skillPath)) {
      console.error(`Skill not found: ${skillName}`);
      return null;
    }

    const skillFilePath = path.join(skillPath, 'SKILL.md');
    const skillContent = fs.readFileSync(skillFilePath, 'utf-8');

    // TODO: Load reference templates from Google Drive
    // const driveTemplates = await loadSkillTemplatesFromDrive(skillName);
    // if (!driveTemplates) {
    //   console.warn(`No Drive templates found for ${skillName}, falling back to filesystem`);
    //   return loadSkill(skillName);
    // }
    // return {
    //   name: skillName,
    //   description: extractDescription(skillContent),
    //   skillContent,
    //   references: driveTemplates.templates,
    //   useDriveTemplates: true,
    // };

    // For now, use filesystem-based loading
    return {
      name: skillName,
      description: extractDescription(skillContent),
      skillContent,
      references: {},
      useDriveTemplates: false,
    };
  } catch (error) {
    console.error(`Error loading skill ${skillName} with Drive templates:`, error);
    // Fallback to filesystem
    return loadSkill(skillName);
  }
}

/**
 * Extract description from skill frontmatter
 */
function extractDescription(content: string): string {
  const match = content.match(/description:\s*(.+)/i);
  return match ? match[1] : 'HR Skill';
}

/**
 * Get list of available skills
 */
export function listSkills(): string[] {
  try {
    const skillsPath = path.join(process.cwd(), '..', 'skills');

    if (!fs.existsSync(skillsPath)) {
      return [];
    }

    return fs.readdirSync(skillsPath).filter((item) => {
      const itemPath = path.join(skillsPath, item);
      return fs.statSync(itemPath).isDirectory() && fs.existsSync(path.join(itemPath, 'SKILL.md'));
    });
  } catch (error) {
    console.error('Error listing skills:', error);
    return [];
  }
}

/**
 * Build system prompt with skill context
 */
export function buildSkillSystemPrompt(skill: SkillContext): string {
  let prompt = `# Active Skill: ${skill.name}\n\n`;

  // Add main skill instructions
  prompt += `${skill.skillContent}\n\n`;

  // Add reference materials
  if (Object.keys(skill.references).length > 0) {
    prompt += '---\n\n# Reference Materials\n\n';

    for (const [name, content] of Object.entries(skill.references)) {
      prompt += `## ${name}\n\n${content}\n\n`;
    }
  }

  return prompt;
}

/**
 * Generate a cacheable skills catalog for prompt caching optimization
 * This catalog contains summaries of all available skills (~15,000 tokens)
 * and is cached to reduce API costs by 90%
 */
export function generateCacheableSkillsCatalog(): string {
  try {
    const skillsPath = path.join(process.cwd(), '..', 'skills');

    if (!fs.existsSync(skillsPath)) {
      return '';
    }

    const skillFolders = fs.readdirSync(skillsPath).filter((item) => {
      const itemPath = path.join(skillsPath, item);
      return fs.statSync(itemPath).isDirectory() && fs.existsSync(path.join(itemPath, 'SKILL.md'));
    });

    let catalog = `\n\n---\n\n# HR Skills Catalog\n\n`;
    catalog += `The HR Command Center has ${skillFolders.length} specialized HR skills available. When users ask about HR topics, you can reference these skills to provide expert guidance.\n\n`;
    catalog += `## Available Skills:\n\n`;

    for (const folder of skillFolders) {
      const skillPath = path.join(skillsPath, folder, 'SKILL.md');

      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf-8');

        // Extract title and description
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const descMatch = content.match(/description:\s*(.+)/i);

        const title = titleMatch
          ? titleMatch[1]
          : folder.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const description = descMatch ? descMatch[1] : '';

        // Extract key sections with more detail for better caching value
        // This increases token count to meet the 15,000 target while providing useful context
        // We include ~600 tokens per skill (25 skills × 600 = 15,000 tokens)
        const overviewMatch = content.match(/##\s+Overview\s+([\s\S]+?)(?=\n##|\n---|$)/i);
        const capabilitiesMatch = content.match(
          /##\s+(?:Your )?Capabilities\s+([\s\S]+?)(?=\n##|\n---|$)/i
        );
        const whenToUseMatch = content.match(
          /##\s+When to (?:Use|Activate)\s+([\s\S]+?)(?=\n##|\n---|$)/i
        );

        catalog += `### ${title}\n`;
        catalog += `**Skill ID:** \`${folder}\`\n`;
        if (description) {
          catalog += `**Description:** ${description}\n`;
        }

        // Add full overview section (up to 1200 chars)
        if (overviewMatch) {
          catalog += `\n${overviewMatch[1].trim().substring(0, 1200)}\n`;
        } else {
          catalog += `\n${content.substring(0, 1200).replace(/\n/g, ' ')}\n`;
        }

        // Add full capabilities section (up to 1000 chars)
        if (capabilitiesMatch) {
          const capabilities = capabilitiesMatch[1].trim().substring(0, 1000);
          catalog += `\n**Capabilities:**\n${capabilities}\n`;
        }

        // Add when to use section (up to 600 chars)
        if (whenToUseMatch) {
          const whenToUse = whenToUseMatch[1].trim().substring(0, 600);
          catalog += `\n**When to Use:**\n${whenToUse}\n`;
        }

        catalog += `\n---\n\n`;
      }
    }

    catalog += `---\n\n`;
    catalog += `**Note:** These skills are automatically detected based on user queries. You can reference their capabilities when providing HR guidance.\n`;

    return catalog;
  } catch (error) {
    console.error('Error generating skills catalog:', error);
    return '';
  }
}
