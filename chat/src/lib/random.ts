export function getRandomName() {
    const sounds = ["啾啾", "喵喵", "嘟嘟", "噜噜", "哒哒", "蹦蹦", "咕咕", "噗噗", "嗷嗷", "汪汪",
        "呼噜", "咩咩", "呆呆", "哞哞", "嘎嘎", "哼哼", "嗷呜", "吱吱", "咕噜", "吧唧"];

    const animals = ["兔", "狸", "熊", "羊", "马", "狐", "鸡", "鸭", "虎",
        "牛", "鹅", "豹", "狼", "狮", "鼠", "蛙", "鸟", "狗", "鲸"];

    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

    return `${randomSound}${randomAnimal}#${Date.now().toString().slice(-3)}`;
}


