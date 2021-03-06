import { ColumnInfo } from "./ColumnInfo";
import { ColumnType } from "./ColumnType";
import { DbContext, GenerateSql } from "..";
import { ReferenceInfo } from "./ReferenceInfo";

/**
 * 由实体类继承该类，操作sqlite 
 * */
export abstract class Table {
    /**列定义的信息 */
    public __columnsDef: Array<ColumnInfo>;
    /**主键列 */
    public __primaryColDef: ColumnInfo;
    /**表名 */
    public __tableName: string;
    public __refsDef: Array<ReferenceInfo>;
    constructor() {
        this.__columnsDef = this.constructor["__columns__"];
        this.__primaryColDef = this.__columnsDef.find(m => (m.type & ColumnType.PRIMARY) == ColumnType.PRIMARY);
        this.__tableName = this.constructor["__table_name__"];
        this.__refsDef = this.constructor["__references__"];
        if (this.__primaryColDef == null) {
            throw `${this.__tableName} 实体未定义主键，每个实体必须定义一个主键，且只有一个，例如：@column(ColumnType.STRING | ColumnType.PRIMARY)`;
        }
    }
    /**保存被修改的数据 */
    async save(): Promise<boolean> {
        let change = this.queryChange();
        var context = new DbContext(<any>this.constructor);
        let isExist = await context.exist(this[this.__primaryColDef.name]);
        if (isExist && change == null) {
            throw "请调用 sqlite.formSql 等方法，从返回的值中修改相应的字段，再调用save()";
        }
        var gSql = new GenerateSql();
        let sql: [string, any[]];
        if (isExist && change != null) {
            sql = gSql.gUpdateSql(this.__tableName, this.__primaryColDef.name, this[this.__primaryColDef.name], change);
        } else {
            sql = gSql.gInsertSql(this.__tableName, this.__columnsDef, this);
        }
        let result = await context.execSql(sql[0], sql[1]);
        return result > 0;
    }

    /**
     * 获取引用的表记录 
     * */
    async getRefData<T extends Table>(tableInstance: T): Promise<Array<T> | Array<{ name: string, data: Array<T> }>> {
        var result = [];
        var context = new DbContext<T>(<any>tableInstance.constructor);
        var refs = this.__refsDef.filter(m => m.refTableName == tableInstance.__tableName);

        if (refs != null && refs.length > 1) {
            for (let index = 0; index < refs.length; index++) {
                const element = refs[index];
                let obj = {};
                obj[element.refKeyName] = this[element.foreignKeyName];
                let list = await context.query(obj);
                result.push({ name: element.foreignKeyName, data: list });
            }
        } else if (refs != null && refs.length == 1) {
            for (let index = 0; index < refs.length; index++) {
                const element = refs[index];
                let obj = {};
                obj[element.refKeyName] = this[element.foreignKeyName];
                let list = await context.query(obj);
                result.push(...list);
            }
        }
        return result;
    }


    /**
     * 查询被修改的字段信息
     */
    private queryChange(): any {
        let change = {};
        let diff = this["__diff__"];
        if (diff != null) {
            for (const key in diff) {
                if (diff.hasOwnProperty(key)) {
                    const element = diff[key];
                    if (this[key] != element) {
                        change[key] = this[key];
                    }
                }
            }
            return change;
        } else {
            return null
        }
    }

    /**检查列定义是否与定义类型一致,在insert update save 中检查 */
    public checkColDef() {
        if (this.__columnsDef != null && this.__columnsDef.length > 0) {
            for (let index = 0; index < this.__columnsDef.length; index++) {
                const colInfo = this.__columnsDef[index];
                let val = this[colInfo.name];
                if (val != null) {
                    //数值类型
                    if ((colInfo.type & ColumnType.NUMBER) === ColumnType.NUMBER) {
                        if (typeof (val) != "number") {
                            throw `表实体${this.__tableName}中的字段${colInfo.name}类型与@column定义的不一致,应为number类型`;
                        }
                    }
                    //布尔类型
                    if ((colInfo.type & ColumnType.BOOLEAN) === ColumnType.BOOLEAN) {
                        if (typeof (val) != "boolean") {
                            throw `表实体${this.__tableName}中的字段${colInfo.name}类型与@column定义的不一致,应为boolean类型`;
                        }
                    }
                    //日期类型
                    if ((colInfo.type & ColumnType.DATE) === ColumnType.DATE) {
                        if (!(val instanceof Date)) {
                            throw `表实体${this.__tableName}中的字段${colInfo.name}类型与@column定义的不一致,应为Date类型`;
                        }
                    }
                    //字符串类型
                    if ((colInfo.type & ColumnType.STRING) === ColumnType.STRING) {
                        if (typeof (val) != "string") {
                            throw `表实体${this.__tableName}中的字段${colInfo.name}类型与@column定义的不一致,应为string类型`;
                        }
                    }
                    //数组类型
                    if ((colInfo.type & ColumnType.ARRAY) === ColumnType.ARRAY) {
                        if (!(val instanceof Array)) {
                            throw `表实体${this.__tableName}中的字段${colInfo.name}类型与@column定义的不一致,应为Array<T> 或 [] 类型`;
                        }
                    }
                }
            }
        }

    }

}