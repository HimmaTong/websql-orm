import { class_info } from './class_info';

import { sqlite } from "../src/sqlite";
import { student } from "./student";

export class Demo {
    constructor() {
        var that = this;
        setTimeout(async () => {
            var uid = that.uuid();
            var uid2 = that.uuid();
            //实体实例
            var data = new student();
            data.id = uid;
            data.user_name = "Tom";
            data.age = 16;
            data.isGirl = false;
            data.create_time = new Date();
            data.stu_data = ['数据1', '数据2'];
            data.other_data = { age: 18, isGril: true };
            data.class_id = uid2;
            //插入记录
            var insertResult = await sqlite.insert(data);

            var data2 = new class_info();
            data2.id = uid2;
            data2.name = "测试引用数据";
            var insertResult2 = await sqlite.insert(data2);

            if (insertResult) {
                //使用sql语句查询刚刚插入的记录
                var result = await sqlite.fromSqlFirst(new student(), "select * from student where id=?", [uid]);
                console.log("使用sql语句查询刚刚插入的记录：")
                console.log(result);
                console.log("读取引用数据：");
                var refData = await await result.getRefData(new class_info());
                console.log(refData)
                //修改user_name
                result.user_name = "Sam";
                //直接调用save()方法保存
                var saveResult = await result.save();
                if (saveResult) {
                    //使用简易方法查询刚刚保存的记录
                    var info = await sqlite.queryFirst(new student(), { id: uid });
                    console.log("使用简易方法查询刚刚保存的记录：")
                    console.log(info);
                }
            }

            //演示一次性插入多条记录
            var students = new Array<student>();
            var stu1 = new student();
            stu1.id = that.uuid();
            stu1.user_name = "David";
            stu1.create_time = new Date();
            var stu2 = new student();
            stu2.id = that.uuid();
            stu2.user_name = "David";
            students.push(...[stu1, stu2]);
            //搜入记录
            var insertsResult = await sqlite.insert(students);
            if (insertsResult) {
                //查询返回多条记录
                var stus = await sqlite.query(new student(), { user_name: "David" });
                console.log("使用简易方法查询查询返回多条记录：");
                console.log(stus);
            }
        }, 0);
    }

    /**
     * 生成伪guid
     */
    public uuid(): string {
        let s: any[] = [];
        let hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";
        let uuid = s.join("");
        return uuid;
    }
}
new Demo();