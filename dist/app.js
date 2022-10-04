"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 8080;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/getxml', express_1.default.static(__dirname + '/public/me.xml'));
app.use('/getavatar', express_1.default.static(__dirname + '/public/avatar.jpg'));
app.use('/getmp3', express_1.default.static(__dirname + '/public/test.mp3'));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map