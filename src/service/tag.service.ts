import { tagRepo } from '../repo/tag.repo';
import { CreateTagDTO, UpdateTagDTO, Tag } from '../types';

export class TagService {
  /**
   * Creates a new tag. Throws if tag already exists.
   */
  createTag(dto: CreateTagDTO): Tag {
    const existing = tagRepo.findByTag(dto.tag);
    if (existing) {
      throw new Error(`Tag '${dto.tag}' already exists.`);
    }
    return tagRepo.create(dto);
  }

  /**
   * Lists all active tags.
   */
  listTags(): Tag[] {
    return tagRepo.findAllActive();
  }

  /**
   * Updates an existing tag.
   */
  updateTag(tagName: string, dto: UpdateTagDTO): void {
    const tag = tagRepo.findByTag(tagName);
    if (!tag) {
      throw new Error(`Tag '${tagName}' not found.`);
    }
    tagRepo.update(tagName, dto);
  }

  /**
   * Soft deletes a tag. Does not delete associated events.
   */
  deleteTag(tagName: string): void {
    const tag = tagRepo.findByTag(tagName);
    if (!tag) {
      throw new Error(`Tag '${tagName}' not found.`);
    }
    tagRepo.delete(tagName);
  }
}

export const tagService = new TagService();
