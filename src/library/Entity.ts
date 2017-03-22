/// <reference path="./WebSQL.d.ts" />
class Entity {
    private db: Database;
    private dbName: string;
    private _table: string;
    private _where: string;
    private _error: string;
    constructor(dbname: string) {
        this.dbName = dbname;
        this.db = window.openDatabase(dbname, '1.0.0', '', 65536 * 100);
    }
    /**获取数据库名
     * @returns string
     */
    getDBName(): string {
        return this.dbName;
    }
    Initial<T>(): Entity {
        console.log("Initial");
        
        return this;
    }

    init(tableName: string, colums: Array<Colum>): Entity {
        try {
            this.switchTable(tableName);
        } catch (error) {

        }
        colums.length > 0 ? this.createTable(colums) : '';
        return this;
    }

    createTable(colums: Array<Colum> | any) {
        var sql = "CREATE TABLE IF NOT EXISTS " + this._table;
        var t;
        if (colums instanceof Array && colums.length > 0) {
            t = [];
            for (var i in colums) {
                t.push(colums[i].name + ' ' + colums[i].type);
            }
            t = t.join(', ');
        } else if (typeof colums == "object") {
            t += colums.name + ' ' + colums.type;
        }
        sql = sql + " (" + t + ")";
        this.db.transaction(function (t) {
            t.executeSql(sql);
        });
    }

    switchTable(tableName: string) {
        console.log("switchTable:" + tableName);
        this._table = tableName;
        return this;
    }
    insertData(data: any | Array<any>): Promise<boolean> {
        var that = this;
        var promise = new Promise<boolean>(resolve => {
            var sql = "INSERT INTO " + this._table;
            if (data instanceof Array && data.length > 0) {
                var cols = [], qs = [];
                for (var i in data[0]) {
                    cols.push(i);
                    qs.push('?');
                }
                sql += " (" + cols.join(',') + ") Values (" + qs.join(',') + ")";
            } else {
                resolve(false);
                return;
            }
            var p = [];
            var d = data;
            var pLenth = 0;
            var r = [];
            var dLength: number = d.length;

            for (var index = 0; index < dLength; index++) {
                var k = [];
                for (var j in d[index]) {
                    k.push(d[index][j]);
                }
                p.push(k);
            }
            var queue = function (b?, result?) {
                if (result) {
                    r.push(result.insertId || result.rowsAffected);
                }
                if (p.length > 0) {
                    that.db.transaction(function (t) {
                        t.executeSql(sql, p.shift(), queue, that.onfail);
                    })
                } else {
                    resolve(!!r);
                }
            }
            queue();
        });
        return promise;
    }

    where(where: any | string) {
        if (typeof where === 'object') {
            var j = this.toArray(where);
            this._where = j.join(' and ');
        } else if (typeof where === 'string') {
            this._where = where;
        }
        console.log("where:");
        console.log(where);
        return this;
    }

    updateData(data: any): Promise<any> {
        var that = this;
        var sql = "Update " + this._table;
        console.log("updateData:");
        console.log(data);
        data = this.toArray(data).join(',');

        sql += " Set " + data + " where " + this._where;
        return this.doQuery(sql);
    }

    async  saveData(data: any): Promise<any> {
        var sql = "Select * from " + this._table + " where " + this._where;
        var that = this;
        var queryResult = await that.doQuery(sql);
        if (queryResult.length > 0) {
            return that.updateData(data);
        } else {
            return that.insertData([data]);
        }
    }

    getData(callback): Promise<any> {
        var that = this;
        var sql = "Select * from " + that._table;
        that._where.length > 0 ? sql += " where " + that._where : "";
        return that.doQuery(sql);
    }
    doQuery(sql): Promise<any> {
        var that = this;
        var promise = new Promise(resolve => {
            var a = [];
            var bb = function (b, result) {
                if (result.rows.length) {
                    for (var i = 0; i < result.rows.length; i++) {
                        a.push(result.rows.item(i));
                    }
                } else {
                    a.push(result.rowsAffected);
                }
                resolve(a);
            }
            that.db.transaction(function (t) {
                t.executeSql(sql, [], bb, that.onfail);
            })
        });
        return promise;
    }
    //根据条件删除数据
    deleteData(): Promise<any> {
        var that = this;
        var sql = "delete from " + that._table;
        that._where.length > 0 ? sql += " where " + that._where : '';
        return that.doQuery(sql);
    }
    //删除表
    dropTable() {
        var sql = "DROP TABLE IF EXISTS " + this._table;
        this.doQuery(sql);
    }

    onfail(t, e) {
        this._error = e.message;
        console.log('----sqlite:' + e.message);
    }
    toArray(obj): Array<any> {
        var t = [];
        obj = obj || {};
        if (obj) {
            for (var i in obj) {
                t.push(i + "='" + obj[i] + "'");
            }
        }
        return t;
    }
}

class Colum {
    name: string;
    type: string;
}
