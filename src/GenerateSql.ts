import { ColumnInfo } from "./ColumnInfo";
import { ColumnType } from "./ColumnType";

/**
 * 生成sql语句
 */
export class GenerateSql {
    constructor() {

    }

    /**
     * 生成创建表sql语句
     */
    gCreateTableSql(__tableName: string, columnDef: Array<ColumnInfo>): string {
        let sql = "CREATE TABLE IF NOT EXISTS " + __tableName;
        let colSql = [];
        if (columnDef instanceof Array && columnDef.length > 0) {
            for (let index = 0; index < columnDef.length; index++) {
                const element = columnDef[index];
                let _type: string;
                _type = "TEXT";
                if ((element.type & ColumnType.STRING) === ColumnType.STRING) {
                    _type = "TEXT";
                }
                if ((element.type & ColumnType.NUMBER) === ColumnType.NUMBER) {
                    _type = "NUMERIC";
                }
                if ((element.type & ColumnType.BOOLEAN) === ColumnType.BOOLEAN) {
                    _type = "INTEGER";
                }
                if ((element.type & ColumnType.ARRAY) === ColumnType.ARRAY) {
                    _type = "TEXT";
                }
                if ((element.type & ColumnType.ANY) === ColumnType.ANY) {
                    _type = "TEXT";
                }
                if ((element.type & ColumnType.PRIMARY) === ColumnType.PRIMARY) {
                    _type += " PRIMARY KEY NOT NULL";
                }
                colSql.push(element.name + ' ' + _type);
            }

        }
        sql = sql + " (" + colSql.join(', ') + ")";
        return sql;
    }

    /**
     * 生成插入记录sql语句
     */
    gInsertSql(__tableName: string, __columnsDef: any, value: any): [string, Array<any>] {
        let that = this;
        let sql: string = `insert into ${__tableName} `;
        let cols = [];
        let qs = [];
        if (__columnsDef instanceof Array && __columnsDef.length > 0) {
            let param: Array<any> = [];
            for (let index = 0; index < __columnsDef.length; index++) {
                const col = __columnsDef[index];
                cols.push(col.name);
                qs.push('?');
                if (value[col.name] != null) {
                    if (value[col.name] instanceof Date) {
                        //param.push(value[col.name].toJSON());
                        param.push(value[col.name]);
                    } else if (typeof (value[col.name]) == "object") {
                        param.push(JSON.stringify(value[col.name]));
                    }
                    else {
                        param.push(value[col.name]);
                    }

                } else {
                    param.push(null);
                }
            }
            sql += " (" + cols.join(',') + ") values (" + qs.join(',') + ")";
            let tuple: [string, Array<any>] = [sql, param];
            return tuple;
        } else {
            return null;
        }
    }

    /**
    * 生成更新记录sql语句
    */
    gUpdateSql(__tableName: string, primaryKeyName: string, primaryKeyValue: string, diffValue: any): [string, Array<any>] {
        let that = this;
        let sql: string = `update ${__tableName} set `;
        let cols = [];
        let param: Array<any> = [];
        if (diffValue != null) {
            for (const key in diffValue) {
                if (diffValue.hasOwnProperty(key)) {
                    if (key == primaryKeyName) {
                        continue;
                    }
                    if (key == "__columnsDef" || key == "__primaryColDef" || key == "__tableName" || key == "__tableName" || key == "__diff__") {
                        continue;
                    }
                    const element = diffValue[key];
                    cols.push(key);
                    if (element != null) {
                        if (element instanceof Date) {
                            //param.push(element.toJSON());
                            param.push(element);
                        } else if (typeof (element) == "object") {
                            param.push(JSON.stringify(element));
                        }
                        else {
                            param.push(element);
                        }
                    } else {
                        param.push(null);
                    }
                }
            }
        }
        sql += cols.join(" = ? , ") + " = ? where " + primaryKeyName + " = " + "?" + " ;";
        param.push(primaryKeyValue);
        let tuple: [string, Array<any>] = [sql, param];
        return tuple;

    }
}