export interface DruidConfig {
    url: string;
    username?: string;
    password?: string;
    timeout?: number;
}
export interface DruidDatasource {
    name: string;
    properties: {
        created: string;
        segmentGranularity: string;
        type: string;
    };
}
export interface DruidSegment {
    dataSource: string;
    interval: string;
    version: string;
    partition: number;
    size: number;
}
export interface DruidQueryResult {
    data: any[];
    meta?: any;
    context?: any;
}
export interface DruidColumn {
    name: string;
    type: string;
    hasMultipleValues?: boolean;
    size?: number;
    cardinality?: number;
}
export interface DruidDatasourceMetadata {
    id: string;
    intervals: string[];
    columns: DruidColumn[];
    size: number;
    count: number;
    queryGranularity: string;
    segmentGranularity: string;
    rollup: boolean;
}
export declare class DruidClient {
    private client;
    constructor(config: DruidConfig);
    /**
     * Execute a SQL query against Druid
     */
    executeSqlQuery(query: string, context?: Record<string, any>): Promise<DruidQueryResult>;
    /**
     * Execute a native JSON query against Druid
     */
    executeNativeQuery(query: Record<string, any>): Promise<DruidQueryResult>;
    /**
     * Get list of all datasources
     */
    getDatasources(): Promise<string[]>;
    /**
     * Get detailed metadata for a specific datasource
     */
    getDatasourceMetadata(datasourceName: string): Promise<DruidDatasourceMetadata>;
    /**
     * Get segments for a datasource
     */
    getSegments(datasourceName?: string): Promise<DruidSegment[]>;
    /**
     * Get server status
     */
    getStatus(): Promise<{
        status: string;
        version?: string;
    }>;
    /**
     * Test connection to Druid
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=druid-client.d.ts.map