/**
 * 数据库服务 - 负责JDBC连接和元数据获取
 */

export interface DatabaseConfig {
  dbType: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  comment: string;
}

export interface TableMetadata {
  name: string;
  comment: string;
  columns: ColumnMetadata[];
}

export interface DatabaseMetadata {
  database: string;
  tables: TableMetadata[];
}

// 后端API的基础URL，开发环境通过Vite代理
const API_BASE_URL = '/api';

/**
 * 测试数据库连接
 */
export async function testDatabaseConnection(config: DatabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/database/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '连接测试失败');
    }
    
    return data;
  } catch (error: any) {
    console.error('测试连接失败:', error);
    return {
      success: false,
      message: error.message || '网络请求失败，请确保后端服务已启动'
    };
  }
}

/**
 * 获取数据库元数据
 */
export async function getDatabaseMetadata(config: DatabaseConfig): Promise<DatabaseMetadata> {
  try {
    const response = await fetch(`${API_BASE_URL}/database/get-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || '获取元数据失败');
    }

    const metadata: DatabaseMetadata = await response.json();
    return metadata;
  } catch (error: any) {
    console.error('获取元数据失败:', error);
    throw new Error(error.message || '网络请求失败，请确保后端服务已启动');
  }
}

/**
 * 将元数据格式化为文本形式，供AI分析使用
 */
export function formatMetadata(metadata: DatabaseMetadata): string {
  let result = `数据库: ${metadata.database}\n`;
  result += `共 ${metadata.tables.length} 张表\n\n`;
  result += '='.repeat(80) + '\n\n';

  for (const table of metadata.tables) {
    result += `表名: ${table.name}\n`;
    if (table.comment) {
      result += `说明: ${table.comment}\n`;
    }
    result += `字段数: ${table.columns.length}\n`;
    result += '-'.repeat(80) + '\n';
    
    // 字段信息
    result += '字段列表:\n';
    for (const col of table.columns) {
      const pk = col.isPrimaryKey ? ' [主键]' : '';
      const nullable = col.nullable ? ' NULL' : ' NOT NULL';
      const comment = col.comment ? ` // ${col.comment}` : '';
      result += `  - ${col.name}: ${col.type}${nullable}${pk}${comment}\n`;
    }
    
    result += '\n' + '='.repeat(80) + '\n\n';
  }

  return result;
}

/**
 * 获取数据库类型的配置信息
 */
export interface DatabaseTypeConfig {
  id: string;
  name: string;
  defaultPort: string;
  icon: string;
  description: string;
}

export const DATABASE_TYPES: DatabaseTypeConfig[] = [
  {
    id: 'MySQL',
    name: 'MySQL',
    defaultPort: '3306',
    icon: '🐬',
    description: 'MySQL 数据库'
  },
  {
    id: 'PostgreSQL',
    name: 'PostgreSQL',
    defaultPort: '5432',
    icon: '🐘',
    description: 'PostgreSQL 数据库'
  },
  {
    id: 'DM',
    name: '达梦 DM',
    defaultPort: '5236',
    icon: '🗄️',
    description: '达梦数据库'
  },
  {
    id: 'Oracle',
    name: 'Oracle',
    defaultPort: '1521',
    icon: '🔴',
    description: 'Oracle 数据库'
  },
  {
    id: 'SQLServer',
    name: 'SQL Server',
    defaultPort: '1433',
    icon: '🟦',
    description: 'Microsoft SQL Server'
  },
  {
    id: 'MariaDB',
    name: 'MariaDB',
    defaultPort: '3306',
    icon: '🦭',
    description: 'MariaDB 数据库'
  }
];
