


### 目前工具的限制

> 1. 目前脚本 **仅支持 .vue 文件和 .js 文件** 中的中文提取与写入，如果涉及其他文件夹下的内容，可根据脚本内容进行修改对应需要处理的文件内容
> 2. 目前支持 vue 项目
> 3. 写入的脚本需 **本地 node 环境版本不能低于 10.12.0**

### 工具依赖包的安装

1. 安装工具依赖包

```js
$ npm i -g i18n-vue-cli
```
目前该工具属于全局指令操作，所以需要全局安装


### 项目中中文的提取

参考：
```js
i18n-vue-cli getlang src/view -f system.json -d system -e systemTrans
```
src/view 为文件入口，相对于命令行位置src下view文件下
-f system.json 写入system.json
-d system  为src/view/system目录
-e systemTrans  systemTrans为额外参数

> 从项目中的 .vue 文件 和 .js 文件中收集中文字符，并将收集到的字符存储到一个键值对的 .json 文件中
> 同时会将收集到的数据转为中文key的键值，写入根目录下src/locale/lang/en_US 和 src/locale/lang/zh_CN 目录下，以额外参数命名的js文件 如systemTrans.js

```js
//src/locale/lang/zh_CN
 systemTrans: {
    新增: 新增,
 }
```
```js
//src/locale/lang/en_US 英文目录会自动调用百度翻译进行简易翻译
 systemTrans: {
    新增: 'add',
 }
```
### 项目中中文的替换

> 将提取的中文文件（.json 文件）中的中文以 i18n （如 `$tt('a.b')`）的形式替换到项目对应的中文位置

1. 执行 writeLang 将中文以 i18n 的模式写入文件（仅支持 components 与 pages 里的 .vue 文件和 .js 文件）

```js
$ i18n-vue-cli writelang <srcDist> -f <filename> -d <dir> -i <ignoredir> -e<额外参数>
```
  
  ```js
  // 例如 i18n-vue-cli writelang src3 -f system.json -d system -e systemTrans
$ i18n-vue-cli writelang <srcDist> -f <filename> -d <dir> -i <ignoredir> -e<额外参数>
```
+ srcDist 为复制 src 出来的文件夹名
+ filename 为生成的语言文件的文件名，必须为json格式， 默认为zh_cn.json
+ dir 为要替换成 $t 的文件目录, 默认为 pages, components
+ ignoredir 为 dir 目录下被忽略的文件目录

> 注：    
> 1、非 .vue 文件需要引用 i18n 才能使用    
> 2、dir 可以是src下的任意文件目录

执行以上脚本后会在 src 同级目录生成 srcDist 文件夹，文件夹内仅包含 components 与 pages 文件夹下的 .vue 文件和 .js 文件

2. 将 srcDist 文件夹内容替换到 src 文件夹中，覆盖重复的文件

3. 在src/locale/lang/zh_CN和src/locale/lang/en_US目录下的index.js文件中引入生成的语言文件

4. 在js文件中引入$tt import { tryTranslate as $tt } from "@/locale/utils";

  ```js
  //  /locale/utils 采用中文title兜底策略
import i18n from "@/locale/index";
/**
 *i18n翻译
 */
 export function tryTranslate(title, key) {
  let realyKey = `${key}['${title}']`;
  // i18n.t(`${key}`)[title]  这种形式也可以
  if (i18n.te(realyKey)) return i18n.t(realyKey);
  return title;
}
```

5. 运行项目，全局遍历一下是否有遗漏

> 注： 以上基于项目中已加入 i18n ，并且已做好配置。

