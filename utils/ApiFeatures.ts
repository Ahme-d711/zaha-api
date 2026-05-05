import type { Query, Document } from 'mongoose';

interface QueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sort?: string;
  [key: string]: unknown;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class ApiFeatures<T extends Document> {
  private query: Query<T[], T>;
  private queryParams: QueryParams;
  private originalQuery: Query<T[], T>;
  private page: number;
  private limit: number;

  constructor(query: Query<T[], T>, queryParams: QueryParams) {
    this.originalQuery = query.clone();
    this.query = query;
    this.queryParams = queryParams;
    
    // Calculate page and limit once
    this.page = Math.max(Number(queryParams.page) || 1, 1);
    this.limit = Math.min(Math.max(Number(queryParams.limit) || 10, 1), 100);
  }

  /**
   * Apply filters from query parameters
   * Supports MongoDB operators: gte, gt, lte, lt, ne, in
   */
  filter(): this {
    const queryObj: Record<string, unknown> = { ...this.queryParams };
    
    // Remove pagination, search and sort fields (categoryId is a real filter)
    const excluded = ['page', 'limit', 'search', 'sort'] as const;
    excluded.forEach((field) => delete queryObj[field]);

    // Build filter object manually (safer than JSON.parse/stringify)
    const filter: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Handle MongoDB operators (e.g., price[gte] -> price: { $gte: value })
      const operatorMatch = key.match(/^(.+)\[(gte|gt|lte|lt|ne|in)\]$/);
      
      if (operatorMatch) {
        const [, field, operator] = operatorMatch;
        if (!filter[field]) {
          filter[field] = {};
        }
        (filter[field] as Record<string, unknown>)[`$${operator}`] = value;
      } else {
        // Regular field
        // If value is an array, use $in operator (useful for multiple selections or array fields)
        if (Array.isArray(value)) {
          filter[key] = { $in: value };
        } else {
          filter[key] = value;
        }
      }
    }

    if (Object.keys(filter).length > 0) {
      this.query = this.query.find(filter);
    }
    
    return this;
  }
  
  /**
   * Apply search across multiple fields using regex
   */
  search(fields: (keyof T)[] = []): this {
    if (this.queryParams.search && fields.length > 0) {
      const searchTerm = String(this.queryParams.search).trim();

      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i');
        const orConditions: Record<string, unknown>[] = fields.map(
          (field) => ({ [field as string]: searchRegex })
        );

        // Add partial ID search
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: searchTerm,
              options: "i"
            }
          }
        });

        this.query = this.query.find({ $or: orConditions });
      }
    }
    return this;
  }
  
  /**
   * Apply sorting
   */
  sort(defaultSort: Record<string, 1 | -1> | string = { priority: -1, createdAt: -1 }): this {
    if (this.queryParams.sort) {
      let sortBy = String(this.queryParams.sort);
      
      // Map frontend values to backend fields
      if (sortBy === 'popularity') sortBy = '-averageRating';
      if (sortBy === 'newest') sortBy = '-createdAt';
      if (sortBy === 'priceLowHigh') sortBy = 'price';
      if (sortBy === 'priceHighLow') sortBy = '-price';
      if (sortBy === 'featured') sortBy = '-is_best_seller -createdAt';

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(defaultSort);
    }
    return this;
  }

  /**
   * Apply pagination (skip and limit)
   */
  paginate(): this {
    const skip = (this.page - 1) * this.limit;
    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }

  /**
   * Execute the query and return results with pagination info
   */
  async execute(): Promise<{
    results: T[];
    pagination: PaginationResult;
  }> {
    try {
      // Execute the main query
    const results = await this.query;

      // Calculate total count using the current query with all filters applied
      const filter = this.query.getFilter();
      const total = await this.query.model.countDocuments(filter);

      const pages = Math.ceil(total / this.limit);

      return {
        results,
        pagination: {
          page: this.page,
          limit: this.limit,
          total,
          pages,
          totalPages: pages,
          hasNext: this.page < pages,
          hasPrev: this.page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ApiFeatures;
