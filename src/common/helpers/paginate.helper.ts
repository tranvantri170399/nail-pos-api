import { SelectQueryBuilder, Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginatedResult, PaginationDto } from '../dto/pagination.dto';

/**
 * Paginate a TypeORM SelectQueryBuilder.
 */
export async function paginateQueryBuilder<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  pagination: PaginationDto,
): Promise<PaginatedResult<T>> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await qb
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Paginate a TypeORM Repository with FindManyOptions.
 */
export async function paginateRepository<T extends ObjectLiteral>(
  repo: Repository<T>,
  pagination: PaginationDto,
  options: FindManyOptions<T> = {},
): Promise<PaginatedResult<T>> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await repo.findAndCount({
    ...options,
    skip,
    take: limit,
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
