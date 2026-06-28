import { ProgressionManager } from "./ProgressionManager";
import { t } from "../i18n";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const NPC_NAMES = [
  "Granny Maple", "Old Barnaby", "Professor Wren", "Captain Moss",
  "Baker Finch", "Nana Clover", "Postmaster Quill", "Tinker Lark",
  "Widow Hazel", "Farmer Oats", "Mayor Bramble", "Auntie Rue",
  "Cobbler Pip", "Shepherd Fable", "Librarian Sage", "Warden Flint",
  "Tailor Wynn", "Fisherman Cork", "Beekeeper Thyme", "Clockmaker Gale",
];

/** Used for dialogue SFX pitch (lower playback rate for male NPCs). */
const MALE_NPC_NAMES = new Set<string>([
  "Old Barnaby",
  "Professor Wren",
  "Captain Moss",
  "Postmaster Quill",
  "Tinker Lark",
  "Farmer Oats",
  "Mayor Bramble",
  "Cobbler Pip",
  "Warden Flint",
  "Fisherman Cork",
  "Beekeeper Thyme",
  "Clockmaker Gale",
]);

export function isNpcMale(npcName: string): boolean {
  return MALE_NPC_NAMES.has(npcName);
}

const NPC_PORTRAIT_FILES: Record<string, string> = {
  "Granny Maple": "granny_maple.png",
  "Old Barnaby": "old_barnaby.png",
  "Professor Wren": "professor_wren.png",
  "Captain Moss": "capatain_moss.png",
  "Baker Finch": "baker_finch.png",
  "Nana Clover": "nana_clover.png",
  "Postmaster Quill": "postmaster_quill.png",
  "Tinker Lark": "tinker_lark.png",
  "Widow Hazel": "widow_hazel.png",
  "Farmer Oats": "farmer_oats.png",
  "Mayor Bramble": "mayor_bramble.png",
  "Auntie Rue": "auntie_rue.png",
  "Cobbler Pip": "cobbler_pip.png",
  "Shepherd Fable": "shepherd_fable.png",
  "Librarian Sage": "librarian_sage.png",
  "Warden Flint": "warden_flint.png",
  "Tailor Wynn": "tailor_wynn.png",
  "Fisherman Cork": "fisherman_cork.png",
  "Beekeeper Thyme": "beekeeper_thyme.png",
  "Clockmaker Gale": "clockmaster_gale.png",
  "Professor Astrid": "professor_astrid.png",
  "Stargazer Orion": "stargazer_orion.png",
  "Doctor Celeste": "doctor_celeste.png",
  "Sky Jellyfish": "jellyfish.png",
};

export function getNpcPortraitUrl(npcName: string): string {
  if (npcName === "Eternal Flame") return "/2D/eternal_flame.png";
  const file = NPC_PORTRAIT_FILES[npcName];
  return file ? `/npc/${file}` : "";
}

/** Carpet sky-jellyfish quest speaker (see {@link getJellyfishCaptureLine}). */
export const JELLYFISH_NPC_SPEAKER = "Sky Jellyfish";

/**
 * Line after each sky jellyfish is caught. `collectedAfterCapture` is
 * {@link SkyJellyfish#getCollectedCount} immediately after that catch (1…total).
 */
export function getJellyfishCaptureLine(
  collectedAfterCapture: number,
  total: number,
): string {
  const remaining = total - collectedAfterCapture;
  if (collectedAfterCapture === 1) {
    return t(
      `I am separated from my kin. Please find them. There are ${remaining} more to find.`,
      `我与同伴失散了。请找到它们。还有 ${remaining} 个要找。`,
    );
  }
  if (remaining <= 0) {
    return t("All of us are together again. Thank you.", "我们又团聚了。谢谢你。");
  }
  if (remaining === 1) {
    return t("There is 1 more to find.", "还有 1 个要找。");
  }
  return t(`There are ${remaining} more to find.`, `还有 ${remaining} 个要找。`);
}

/** Cosmic-void intro; shown via {@link PackageQuestHUD#showBubble} as two sequential lines. */
export const ETERNAL_FLAME_SPEAKER = "Eternal Flame";
export const ETERNAL_FLAME_VOID_BUBBLES: readonly [string] = [
  t("Defend me! Lunar moths hunger for the last ember. Please, do not let them reach the flame.", "保护我！月蛾渴望吞噬最后的余烬。求你，别让它们碰到火焰。"),
];

/**
 * Dialogue spoken by the Eternal Flame between waves.
 * Index 0 = after wave 1 clears (before wave 2), index 1 = after wave 2 clears (before wave 3).
 */
export const VOID_WAVE_BETWEEN_DIALOGUE: readonly [string, string] = [
  t("The scouts fall. But the Hungering Flight follows — centuries-old moth-kin. Do not let them reach me.", "斥候已倒下。但饥饿之群紧随其后——那是历经数百年的蛾族。别让它们靠近我。"),
  t("One last surge — the Mothwing Eldest. Hold this light. It will outlast the dark.", "最后一波了——蛾翼长老。守住这道光，它会比黑暗更长久。"),
];

/**
 * Warnings spoken when the shield HP drops to thresholds.
 * Index 0 = at or below 50% HP, index 1 = at or below 3 HP (critical).
 */
export const VOID_SHIELD_LOW_HP_DIALOGUE: readonly [string, string] = [
  t("I feel the cold creeping in — each strike dims the light inside me. Guard the flame while you still can.", "我感到寒意正在侵入——每一击都让我心中的光黯淡。趁还来得及，守护这火焰。"),
  t("I am nearly gone. I have burned since before your stars were named. Please — do not let this be where I end.", "我快要熄灭了。早在你们的群星命名之前，我便已燃烧。求你——别让这里成为我的终点。"),
];

/** Spoken by the Eternal Flame the moment a moth breaches the shield and shatters it. */
export const VOID_FLAME_SHATTER_DIALOGUE =
  t("No... the moths have taken the light. I am... gone.", "不……飞蛾夺走了光。我……消逝了。");

/**
 * Spoken by the Eternal Flame after the player survives all three waves.
 * Index 0 = gratitude, index 1 = willing sacrifice / purpose revealed.
 */
export const VOID_VICTORY_DIALOGUE: readonly [string, string] = [
  t("You held the light when all others fled. I have waited centuries for a guardian such as you. Thank you.", "当所有人都逃离时，你守住了这道光。我等待像你这样的守护者已有数百年。谢谢你。"),
  t("I am ready. Carry my flame to the five ancient braziers — all five. It is the only thing that can stop what falls from the sky. This is what I was born for.", "我准备好了。把我的火焰带到那五座古老的火盆——全部五座。这是唯一能阻止天降之物的办法。这就是我诞生的意义。"),
];

/**
 * Pickup lines by moon phase — each pool uses **items that fit the tone**:
 * - Calm: everyday cosy parcels (jam, gifts, hobbies).
 * - Urgent: deadlines, warnings, important documents (handwritten letter, medicine, sealed orders).
 * - Frantic: survival / last deliveries (emergency supplies, rations, don't ask).
 */

// Moon < 0.5 — mundane, cosy parcels.
const PICKUP_TEMPLATES = [
  t("Could you take this to {dest}? {receiver} has been waiting for days!", "能把这个带到 {dest} 吗？{receiver} 已经等了好几天了！"),
  t("A parcel for {dest}! Handle with care, it's full of jam.", "送往 {dest} 的包裹！小心轻放，里面装满了果酱。"),
  t("Quick delivery to {dest}, please! It's a surprise birthday gift.", "请尽快送到 {dest}！这是一份生日惊喜礼物。"),
  t("This needs to reach {dest} before sundown. Well... before the clouds roll in.", "这个得在日落前送到 {dest}。呃……在乌云聚拢之前。"),
  t("Help! My pen pal in {dest} needs this letter. And the cookies I baked.", "帮帮忙！我在 {dest} 的笔友需要这封信。还有我烤的饼干。"),
  t("Oh, a pilot! Could you fly this to {dest}? The roads are far too winding.", "哦，飞行员！能把这个飞送到 {dest} 吗？路实在太弯曲了。"),
  t("Special order for {dest}. {receiver} will know what it is. Very hush-hush.", "送往 {dest} 的特别订单。{receiver} 会知道是什么的。非常机密。"),
  t("One jar of pickles to {dest} — the village fair judges are waiting.", "一罐腌菜送往 {dest}——村集市的评委们正等着呢。"),
  t("This telescope belongs to {receiver} in {dest}. They lent it ages ago!", "这架望远镜是 {dest} 的 {receiver} 的。很久以前借出去的！"),
  t("A care package for {dest}. Mostly socks. Everyone needs socks.", "送往 {dest} 的关怀包裹。大多是袜子。人人都需要袜子。"),
  t("Please bring this to {dest}! It's a music box — fragile!", "请把这个带到 {dest}！这是一个音乐盒——易碎！"),
  t("Delivery for {dest}: one scarf, hand-knitted. Took me all winter.", "送往 {dest}：一条手织围巾。织了我整整一个冬天。"),
  t("Would you mind? {receiver} in {dest} ordered a book. Three months ago.", "麻烦你了？{dest} 的 {receiver} 订了一本书。三个月前订的。"),
  t("This pie needs to get to {dest} while it's still warm. Fly fast!", "这个派得趁热送到 {dest}。快飞！"),
  t("A package of seeds for the garden in {dest}. Spring waits for no one!", "送往 {dest} 花园的一包种子。春天不等人！"),
  t("It's just a little box of chocolates for {receiver}. Don't eat any!", "只是给 {receiver} 的一小盒巧克力。一颗都别吃！"),
  t("Take this map to {dest}. {receiver} drew the first half, I drew the rest.", "把这张地图带到 {dest}。前半部分是 {receiver} 画的，剩下的是我画的。"),
  t("This crate of honey goes to {dest}. The bees worked very hard.", "这箱蜂蜜送往 {dest}。蜜蜂们辛苦极了。"),
  t("Could you bring this compass to {receiver}? They keep getting lost.", "能把这个指南针带给 {receiver} 吗？他们老是迷路。"),
  t("A jar of fireflies for {dest}. They light up the whole square!", "送往 {dest} 的一罐萤火虫。它们能照亮整个广场！"),
  t("This quilt belongs in {dest}. Every stitch tells a story.", "这床被子属于 {dest}。每一针都讲述着一个故事。"),
  t("One crate of fresh lemons for {dest}. {receiver} makes the best lemonade!", "送往 {dest} 的一箱新鲜柠檬。{receiver} 做的柠檬水最棒了！"),
  t("{receiver} forgot their lucky hat here. Please fly it back to {dest}!", "{receiver} 把幸运帽落在这儿了。请把它飞送回 {dest}！"),
  t("Careful with this — it's a snow globe of {dest}. Very sentimental.", "小心这个——这是一个 {dest} 的雪景球。非常有纪念意义。"),
  t("A bundle of letters for {dest}. The village hasn't had mail in weeks!", "送往 {dest} 的一捆信。村子已经好几周没收到邮件了！"),
  t("This lantern was crafted for {receiver}. It glows in seven colors!", "这盏灯笼是为 {receiver} 制作的。能发出七彩光芒！"),
  t("Fly this kite to {dest} — it's for the children's festival.", "把这只风筝飞送到 {dest}——这是给儿童节的。"),
  t("One barrel of apple cider for {dest}. Don't let it slosh!", "送往 {dest} 的一桶苹果酒。别让它晃出来！"),
  t("Sheet music for the choir in {dest} — rehearsal is tomorrow, no rush.", "送往 {dest} 合唱团的乐谱——明天排练，不急。"),
];

/** Moon 0.5–0.75 — serious deadlines, warnings, critical goods (not yet last-second panic). */
const PICKUP_TEMPLATES_URGENT = [
  t("This handwritten letter must reach {receiver} in {dest} — it explains the evacuation plan.", "这封手写信必须送到 {dest} 的 {receiver} 手中——它说明了撤离计划。"),
  t("Sealed medical supplies for the clinic in {dest}. {receiver} is running out by the hour.", "送往 {dest} 诊所的密封医疗物资。{receiver} 一小时比一小时短缺。"),
  t("Hurry — take this dossier to {dest} before the council meets. {receiver} needs to read it in person.", "快——在议会召开前把这份卷宗送到 {dest}。{receiver} 必须亲自过目。"),
  t("The moon looks wrong. Get this telescope to {receiver} in {dest} — they need to confirm the readings.", "月亮看起来不对劲。把这架望远镜送到 {dest} 的 {receiver} 那里——他们需要确认读数。"),
  t("A handwritten will for {receiver} in {dest}. They asked for it before dark.", "给 {dest} 的 {receiver} 的手写遗嘱。他们要求天黑前送到。"),
  t("These are signed shelter blueprints — {dest} must receive them before ground breaks.", "这些是签署过的避难所蓝图——{dest} 必须在动工前收到。"),
  t("Take this satchel of medicine to {dest}. Half the village is counting on {receiver}.", "把这袋药品带到 {dest}。半个村子都指望着 {receiver}。"),
  t("A courier's satchel of witness statements — {dest} needs them before the hearing tonight.", "一袋信使送的证人证词——{dest} 需要在今晚听证会前收到。"),
  t("This pie needs to reach {dest} before the storm front — {receiver} won't eat once they're on watch.", "这个派得在风暴前锋到来前送到 {dest}——{receiver} 一旦值守就不吃东西了。"),
  t("Battery packs and spare valves for the signal station in {dest}. {receiver} is holding the line.", "送往 {dest} 信号站的电池组和备用阀门。{receiver} 正在坚守。"),
  t("A sealed envelope from the mayor — only {receiver} in {dest} may open it.", "镇长寄来的一封密封信——只有 {dest} 的 {receiver} 才能拆开。"),
  t("This radio kit goes to {dest}. {receiver} needs to assemble it before nightfall.", "这套无线电设备送往 {dest}。{receiver} 需要在入夜前组装好。"),
  t("Last crate of preserved food for the cellars in {dest}. Don't let it sit out.", "送往 {dest} 地窖的最后一箱储备粮。别让它露天搁置。"),
  t("A handwritten prayer list for {receiver} — families in {dest} need to know who's accounted for.", "给 {receiver} 的手写祈祷名单——{dest} 的家庭们需要知道谁还平安。"),
  t("Take these keys to {dest}. {receiver} must lock the vault before curfew.", "把这些钥匙带到 {dest}。{receiver} 必须在宵禁前锁好金库。"),
  t("The choir's sheet music for tonight's vigil in {dest} — late is not an option.", "送往 {dest} 今晚守夜合唱团的乐谱——绝不能迟到。"),
  t("A wax-sealed letter from the lighthouse — {receiver} in {dest} knows what it means.", "灯塔寄来的一封蜡封信——{dest} 的 {receiver} 知道它意味着什么。"),
  t("This crate of bandages and splints for {dest}. {receiver} is expecting a busy night.", "送往 {dest} 的一箱绷带和夹板。{receiver} 预料今晚会很忙。"),
];

/** Moon ≥ 0.75 — survival, emergency supplies, last possible deliveries. */
const PICKUP_TEMPLATES_FRANTIC = [
  t("EMERGENCY SUPPLIES for {dest}! Water, rations, blankets — move!", "送往 {dest} 的紧急物资！水、口粮、毛毯——快走！"),
  t("This crate is marked EMERGENCY — get it to {receiver} in {dest} — NOW!", "这个箱子标着紧急——立刻送到 {dest} 的 {receiver}——马上！"),
  t("Don't ask what's inside — just fly it to {dest}. {receiver} will know what to do!", "别问里面是什么——只管飞送到 {dest}。{receiver} 知道该怎么做！"),
  t("Last satchel of medical kits and burn dressings for {dest}! GO!", "送往 {dest} 的最后一袋医疗包和烧伤敷料！快去！"),
  t("Evacuation tags for the children — {dest} must receive them before the shelters seal!", "孩子们的撤离标牌——{dest} 必须在避难所封闭前收到！"),
  t("Distress flares and signal powder — {receiver} in {dest} needs this to guide people!", "求救信号弹和信号粉——{dest} 的 {receiver} 需要靠它来引导人群！"),
  t("Emergency rations and purification tablets — {dest} runs out in minutes!", "紧急口粮和净水片——{dest} 几分钟内就要耗尽了！"),
  t("This might be the last delivery anyone ever makes. Emergency supplies to {dest}!", "这也许是有史以来最后一次送货。紧急物资送往 {dest}！"),
  t("TAKE IT! Emergency blankets and rope for {dest} — the ground is splitting!", "拿着！送往 {dest} 的应急毛毯和绳索——地面正在裂开！"),
  t("The final coded message — only {receiver} in {dest} can broadcast it!", "最后的密码讯息——只有 {dest} 的 {receiver} 能广播它！"),
  t("If {dest} doesn't get this emergency crate, nothing else matters anyway!", "如果 {dest} 收不到这箱应急物资，其他一切都无所谓了！"),
  t("First-aid, tourniquets, and plasma — {receiver} said they have seconds left!", "急救包、止血带和血浆——{receiver} 说他们只剩几秒了！"),
  t("No time to explain — emergency supplies for {dest}! Fly!", "没时间解释了——送往 {dest} 的紧急物资！快飞！"),
  t("Last oxygen canisters for the infirmary in {dest}! Please — RUN!", "送往 {dest} 医务室的最后几罐氧气！求你——快跑！"),
  t("Signal lanterns and fuel — {receiver} needs to light the way out!", "信号灯笼和燃料——{receiver} 需要照亮逃生之路！"),
  t("Emergency rations and baby formula — {dest} is out of everything!", "紧急口粮和婴儿奶粉——{dest} 什么都没有了！"),
  t("Take it! Take it and fly! Don't look up — emergency supplies for {dest}!", "拿着！拿着快飞！别抬头看——送往 {dest} 的紧急物资！"),
  t("The sky is falling — get this trauma kit to {receiver} in {dest}!", "天要塌了——把这套创伤急救包送到 {dest} 的 {receiver}！"),
];

/** Moon 0.5–0.75 — relief mixed with dread; may reference letters, medicine, sealed orders. */
const DELIVERY_TEMPLATES_URGENT = [
  t("The letter — thank the skies. I'll read every word before we lock down.", "信——谢天谢地。封锁之前我会逐字读完。"),
  t("Medical supplies in one piece. You may have saved more than you know.", "医疗物资完好无损。你或许拯救了比你想象中更多的人。"),
  t("Have you seen the moon? I'm scared — but this helps us prepare.", "你看到月亮了吗？我很害怕——但这能帮我们做好准备。"),
  t("The sealed envelope... good. Tell {sender} we're following the plan.", "密封信……很好。告诉 {sender}，我们按计划行事。"),
  t("You made it. I wasn't sure anyone would, with the sky like that.", "你成功了。天色那样，我都不确定还有没有人能到。"),
  t("The telescope — {sender} was right to rush this. We see it now.", "望远镜——{sender} 催得对。我们现在看到了。"),
  t("Shelter blueprints received. Tell {sender} we start tonight.", "避难所蓝图已收到。告诉 {sender}，我们今晚动工。"),
  t("Finally! Tell {sender} to get underground if they still can.", "终于到了！告诉 {sender}，趁还来得及赶紧躲到地下。"),
  t("Thank you. I hope this isn't the last delivery I ever receive.", "谢谢你。但愿这不是我收到的最后一次送货。"),
  t("You're braver than most. The others have stopped flying entirely.", "你比大多数人都勇敢。其他人都已经彻底停飞了。"),
  t("{sender} always keeps their promises. Even now. Bless them.", "{sender} 总是信守承诺。即便此刻也是。保佑他们。"),
  t("We needed this. The village is frightened. Stay safe, pilot.", "我们正需要这个。村子里人心惶惶。注意安全，飞行员。"),
  t("The keys — the vault's secure. Thank you, pilot.", "钥匙——金库安全了。谢谢你，飞行员。"),
  t("Radio kit's here. We might still reach someone before dark.", "无线电设备到了。也许天黑前我们还能联系上某人。"),
  t("Bandages accounted for. {sender} didn't exaggerate the hurry.", "绷带都清点过了。{sender} 没有夸大其词。"),
  t("The wax-sealed letter... I'll do what it says. Go. Fly safe.", "那封蜡封信……我会照它说的去做。走吧。一路平安。"),
  t("Witness statements delivered. At least the record will be straight.", "证人证词已送达。至少记录能保持清白。"),
  t("Preserved food for the cellars — we'll stretch it as long as we can.", "地窖的储备粮——我们会尽量省着吃。"),
  t("Prayer list in hand. I'll read every name aloud tonight.", "祈祷名单到手了。今晚我会大声念出每一个名字。"),
  t("Sheet music for the vigil — the choir can sing one more time.", "守夜的乐谱——合唱团还能再唱一次。"),
];

/** Moon ≥ 0.75 — panic; emergency supplies received or too late. */
const DELIVERY_TEMPLATES_FRANTIC = [
  t("THE CRATE! Put it down — we'll unload! NOW GET OUT OF HERE!", "箱子！放下——我们来卸！现在快离开这儿！"),
  t("Emergency supplies — you actually made it?! GO! Don't look back!", "紧急物资——你居然真的到了？！快走！别回头！"),
  t("Don't ask what's inside — we're using it all. Thank you — RUN!", "别问里面是什么——我们全都要用。谢谢你——快跑！"),
  t("Evacuation tags — the children — thank you — the shelters are sealing!", "撤离标牌——孩子们——谢谢你——避难所正在封闭！"),
  t("Flares! We can still signal — pilot, FLY!", "信号弹！我们还能发信号——飞行员，快飞！"),
  t("Rations — water — it's here — now save yourself!", "口粮——水——都到了——现在快保命要紧！"),
  t("The coded message — I'll broadcast — GO! THE SKY IS COMING DOWN!", "密码讯息——我来广播——快走！天要塌下来了！"),
  t("Trauma kits — stack them THERE! Pilot, I love you — LEAVE!", "创伤急救包——堆到那边去！飞行员，我爱你——快离开！"),
  t("Last oxygen — unload! There's no time for goodbyes!", "最后的氧气——卸下来！没时间道别了！"),
  t("Lanterns — fuel — if anyone survives they'll see the light — thank you!", "灯笼——燃料——若有人幸存，他们会看到光——谢谢你！"),
  t("Baby formula — you beautiful fool — RUN!", "婴儿奶粉——你这个可爱的傻瓜——快跑！"),
  t("Emergency blankets — pile them on — thank you — I think we're done for!", "应急毛毯——都堆上去——谢谢你——我想我们完了！"),
  t("Plasma and tourniquets — {sender} sent a saint — NOW RUN!", "血浆和止血带——{sender} 派来了一位圣人——现在快跑！"),
  t("Nothing matters anymore — but you brought hope for five more minutes — GO!", "一切都已无所谓——但你带来了多五分钟的希望——快走！"),
  t("I can't believe you made it. The ground won't stop shaking — RUN!", "我不敢相信你到了。地面震个不停——快跑！"),
  t("Tell {sender} I said goodbye if you see them — and thank you — GO!", "若你见到 {sender}，替我道别——还有谢谢你——快走！"),
  t("You're insane for still flying! Thank you — now LEAVE!", "你还在飞，真是疯了！谢谢你——现在快离开！"),
  t("Bless you, pilot. If we survive this, I owe you everything.", "保佑你，飞行员。若我们能挺过这一关，我欠你一切。"),
  t("The sky is tearing open — supplies are here — SAVE YOURSELF!", "天空正在撕裂——物资到了——快保命！"),
];

// Moon < 0.5 — warm, everyday thanks (jam, cake, gifts).
const DELIVERY_TEMPLATES = [
  t("Finally! I was about to send a carrier pigeon instead.", "终于来了！我都打算改用信鸽了。"),
  t("You made it! The whole village was starting to worry.", "你到了！全村都开始担心了。"),
  t("Marvelous! This is exactly what we needed. You're a legend!", "太棒了！这正是我们需要的。你真是个传奇！"),
  t("Right on time! Well, close enough. Thank you, pilot!", "正好准时！呃，差不多吧。谢谢你，飞行员！"),
  t("At last! I thought it got lost in the clouds.", "终于到了！我还以为它消失在云里了。"),
  t("Wonderful! Now the festival can begin. You saved the day!", "太好了！现在节日可以开始了。你救了大家！"),
  t("Oh my, it's here! I'll put the kettle on to celebrate.", "哎呀，到了！我去烧壶水庆祝一下。"),
  t("Brilliant delivery! You fly faster than the village gossip.", "送得真漂亮！你飞得比村里的流言还快。"),
  t("Three cheers for the pilot! This calls for cake.", "为飞行员欢呼三声！这得来块蛋糕。"),
  t("It arrived in one piece! That's more than the last courier managed.", "完好无损地到了！上一个信使可没做到。"),
  t("You're a lifesaver! Or at least, a pickle-saver.", "你真是救命恩人！至少是救腌菜的恩人。"),
  t("Incredible! I didn't think anyone would brave the winds today.", "太了不起了！我没想到今天会有人敢迎着大风飞。"),
  t("Safe and sound! Tell {sender} I said thank you. And give them a hug.", "平安无事！替我谢谢 {sender}。再给他们一个拥抱。"),
  t("The package! Quick, nobody look — it's a surprise.", "包裹！快，谁都别看——这是个惊喜。"),
  t("Thank you, brave pilot! The skies are friendlier with you in them.", "谢谢你，勇敢的飞行员！有你在，天空都更友善了。"),
  t("I knew {sender} wouldn't forget! You've made my whole week.", "我就知道 {sender} 不会忘！你让我这一整周都开心。"),
  t("Ha! {sender} actually sent it. I owe them a pie now.", "哈！{sender} 真的寄来了。我现在欠他们一个派。"),
  t("Oh, it's even better than I imagined. {sender} has wonderful taste!", "哦，比我想象的还要好。{sender} 真有品味！"),
  t("At last! I was about to fly there myself. Well, walk. I can't fly.", "终于到了！我都打算自己飞过去了。呃，走过去。我不会飞。"),
  t("You must be exhausted! Stay for some tea? No? More deliveries? Of course.", "你一定累坏了！留下喝杯茶？不行？还要送货？当然了。"),
  t("The whole village is cheering! Well, the three of us. Small village.", "全村都在欢呼！呃，就我们三个。村子小。"),
  t("Splendid! I'll write {sender} a thank-you note. Could you deliver that too?", "好极了！我会给 {sender} 写张感谢便条。也能麻烦你送吗？"),
  t("Not a scratch on it! You're the best pilot this side of the globe.", "一点划痕都没有！你是这半个地球上最棒的飞行员。"),
  t("Oh, the colors! {sender} always picks the prettiest wrapping.", "哦，这颜色！{sender} 总是挑最漂亮的包装。"),
  t("I can already smell the cookies inside. Thank you, pilot!", "我已经闻到里面饼干的香味了。谢谢你，飞行员！"),
  t("Perfect timing — I was just about to give up hope!", "时机正好——我刚要放弃希望了！"),
  t("You flew through those clouds for this? You deserve a medal!", "你为这个穿越了那些云层？你该得一枚奖章！"),
  t("Wait, there's a note inside... oh, that's sweet. Thank {sender} for me!", "等等，里面有张便条……哦，真贴心。替我谢谢 {sender}！"),
  t("The children are going to be so happy. You've no idea!", "孩子们会高兴坏的。你都想象不到！"),
  t("A true sky courier! {sender} was right to trust you.", "真正的天空信使！{sender} 信任你是对的。"),
];

/**
 * 0-based quest index. At this index, the **delivery** step is the 3rd completed package (NPC gives heirloom line).
 * Paired with {@link THIRD_PACKAGE_HEIRLOOM_DELIVERY_TEMPLATES} and third-delivery eternal flame in Game.
 */
export const THIRD_PACKAGE_DELIVERY_INDEX = 2;

const THIRD_PACKAGE_HEIRLOOM_DELIVERY_TEMPLATES = [
  t("You kept your word, pilot — and I keep mine. This is the eternal flame from my own hearth: my family passed it down for generations. I want you to have it. You've earned a piece of us.", "你信守了诺言，飞行员——我也信守我的。这是取自我家炉膛的永恒之火：我的家族世代相传。我希望它归你。你赢得了我们的一份心意。"),
  t("The box was a formality. The true gift is this: our family heirloom, an eternal flame that never left our line — until now. Please take it. I'd rather it flew with you than sat on my shelf.", "那个箱子只是个形式。真正的礼物是这个：我们的传家宝，一团从未离开我们家族的永恒之火——直到现在。请收下吧。我宁愿它随你飞翔，也不愿它搁在我的架子上。"),
  t("{sender} said you were the one to trust, and I believe them. This flame has warmed three generations. Carry it, pilot — the sky is your hearth now — and thank you for the delivery.", "{sender} 说你是值得信赖的人，我相信他们。这团火温暖了三代人。带上它吧，飞行员——如今天空就是你的炉膛——也谢谢你的这次送货。"),
  t("My grandmother swore to give this away only to someone who'd run three perfect errands for the village. You just did. It's an eternal flame, our oldest treasure. It's yours, truly.", "我的祖母曾发誓，只把这个交给为村子完美完成三趟差事的人。你刚做到了。这是一团永恒之火，我们最古老的珍宝。它真的属于你了。"),
  t("Here — the parcel was nothing next to this. The eternal flame in my family, the one story we're proudest of. I'm handing it to you. Treat it as your own; you've saved more than a weekend with those flights.", "给你——那个包裹和这个比起来不算什么。我家族的永恒之火，我们最引以为傲的传说。我把它交给你。把它当作自己的吧；你那几趟飞行拯救的远不止一个周末。"),
];

export interface QuestDialogue {
  senderName: string;
  receiverName: string;
  pickupLine: string;
  deliveryLine: string;
}

export function generateQuestDialogue(
  seed: number,
  questIndex: number,
  destName: string,
  moonProgress = 0,
): QuestDialogue {
  const rand = seededRandom(seed * 3571 + questIndex * 113);

  const senderIdx = Math.floor(rand() * NPC_NAMES.length);
  let receiverIdx = Math.floor(rand() * NPC_NAMES.length);
  if (receiverIdx === senderIdx) {
    receiverIdx = (receiverIdx + 1) % NPC_NAMES.length;
  }
  const senderName = NPC_NAMES[senderIdx];
  const receiverName = NPC_NAMES[receiverIdx];

  let pickupPool: string[];
  let deliveryPool: string[];
  if (moonProgress >= 0.75) {
    pickupPool = PICKUP_TEMPLATES_FRANTIC;
    deliveryPool = DELIVERY_TEMPLATES_FRANTIC;
  } else if (moonProgress >= 0.5) {
    pickupPool = PICKUP_TEMPLATES_URGENT;
    deliveryPool = DELIVERY_TEMPLATES_URGENT;
  } else {
    pickupPool = PICKUP_TEMPLATES;
    deliveryPool = DELIVERY_TEMPLATES;
  }

  let pickupLine = pickupPool[Math.floor(rand() * pickupPool.length)];
  pickupLine = pickupLine
    .replace(/\{dest\}/g, destName)
    .replace(/\{receiver\}/g, receiverName);

  let deliveryLine = deliveryPool[Math.floor(rand() * deliveryPool.length)];
  deliveryLine = deliveryLine.replace(/\{sender\}/g, senderName);

  if (
    questIndex === THIRD_PACKAGE_DELIVERY_INDEX &&
    !ProgressionManager.loadPlayerWorldState().packageThirdDeliveryEternalFlameClaimed
  ) {
    const heirloomLine =
      THIRD_PACKAGE_HEIRLOOM_DELIVERY_TEMPLATES[
        Math.floor(rand() * THIRD_PACKAGE_HEIRLOOM_DELIVERY_TEMPLATES.length)
      ]!;
    deliveryLine = heirloomLine.replace(/\{sender\}/g, senderName);
  }

  return { senderName, receiverName, pickupLine, deliveryLine };
}

/** Cosy hot-air-balloon NPC greetings (reuse same NPC names + portraits as package quest). */
/** Straight talk: gremlins, sky pests (mixed in sometimes with balloon greetings). */
const BALLOON_GREETINGS_GREMLINS = [
  t("Watch the clouds — gremlins love to nip at wings. Paintball helps!", "当心云层——小妖精最爱啃机翼。颜料弹很管用！"),
  t("If something small and rude buzzes your plane, that's a gremlin. Harmless. Usually.", "如果有个又小又无礼的东西绕着你的飞机嗡嗡叫，那就是小妖精。无害的。通常是。"),
  t("They say a big gremlin — a Gremlin King — hides in the highest flock. Probably a tall tale.", "他们说有个大妖精——妖精王——藏在最高的群落里。多半是无稽之谈。"),
  t("Gremlins again last week. Stole my sandwich from the basket. Little thieves!", "上周又来了小妖精。从篮子里偷走了我的三明治。小贼！"),
  t("You look like you've met gremlins before. The scuff marks on your wings tell the story.", "看样子你以前遇到过小妖精。你机翼上的擦痕说明了一切。"),
  t("Eternal flames? Old pilots swear the Gremlin King drops one if you best him. Could be true!", "永恒之火？老飞行员们发誓说，要是你打败妖精王，它会掉一团。也许是真的！"),
];

const BALLOON_GREETINGS = [
  t("Oh hello up there! Fancy meeting you in the tiny skies!", "哦，上面的你好呀！没想到在这小小的天空里遇见你！"),
  t("Lovely day for a wander, isn't it? The clouds are extra fluffy today.", "很适合闲游的好日子，对吧？今天的云格外蓬松。"),
  t("Mind the breeze — and the tea in the basket is still warm!", "当心微风——篮子里的茶还热着呢！"),
  t("Hullo! We waved from the basket but you were a bit too fast!", "你好！我们从篮子里招手了，可你飞得太快啦！"),
  t("Tiny skies, big dreams — safe travels, friend!", "小小天空，大大梦想——一路平安，朋友！"),
  t("A little wave from the balloon basket! Isn't the view darling?", "从气球篮里向你轻轻挥手！这景色不是很可爱吗？"),
  t("Slow down if you can — we'd love a proper chat!", "能慢下来的话就慢点——我们很想好好聊聊！"),
  t("The wind is gentle and the mood is cosy. Come say hi again sometime!", "风很温柔，心情也惬意。有空再来打个招呼吧！"),
  t("You're flying like a happy bird! We approve.", "你飞得像只快乐的小鸟！我们很赞同。"),
  t("If you see a cloud shaped like a muffin, that was ours.", "如果你看到一朵松饼形状的云，那是我们的杰作。"),
  t("Warm socks and a warm balloon — that's the life!", "暖暖的袜子和暖暖的气球——这才是生活！"),
  t("Hello, traveller! The world looks so small from up here.", "你好，旅人！从这上面看，世界好小。"),
  t("Cheerio! Save some sky for the rest of us!", "再见啦！给我们也留点天空嘛！"),
  t("We're just drifting and dreaming. You look busy — in a good way!", "我们只是漂着做着梦。你看起来很忙——是好的那种忙！"),
  t("Snug as a bug in a basket! Wave if you fly past again!", "在篮子里舒服得像只小虫！下次飞过记得招手！"),
  t("The stars will be out soon — save some wonder for tonight!", "星星很快就出来了——给今晚留点惊叹吧！"),
  t("A cup of cocoa and a patch of blue — that's all we need.", "一杯可可，一片蓝天——这就是我们所需的一切。"),
  t("You're making the sky look easy! Bravo!", "你把飞行变得这么轻松！好样的！"),
  t("Floaty greetings from the wicker seat!", "从藤椅上向你飘来一声问候！"),
  t("May your tailwinds be kind and your landings soft!", "愿你顺风常伴，着陆轻柔！"),
];

const BALLOON_GREETINGS_UNEASY_DAY = [
  t("Is it just me, or can you see the moon? It's the middle of the day...", "是我的错觉吗，你也能看到月亮？现在可是大白天……"),
  t("The moon shouldn't be out right now. That's... not normal, is it?", "月亮这会儿不该出来的。这……不正常，对吧？"),
  t("I've never seen the moon that big during the day. Have you?", "我从没在白天见过那么大的月亮。你呢？"),
  t("Something about the sky feels wrong today. Can you see it too?", "今天的天空总让人觉得不对劲。你也看出来了吗？"),
  t("My grandmother told stories about the moon showing its face by day. None of them ended well.", "我祖母讲过月亮在白天露面的故事。没有一个有好结局。"),
  t("The birds have gone quiet. And the moon... why is it so close?", "鸟儿都不叫了。还有月亮……它为什么离得这么近？"),
  t("I don't want to alarm you, but look up. Does that seem right to you?", "我不想吓你，但抬头看看。你觉得那正常吗？"),
  t("The clouds are thin and the moon is fat. I don't like it one bit.", "云很薄，月亮很胖。我一点都不喜欢这样。"),
  t("I've been up in this balloon forty years. Never seen the moon like that in daylight.", "我坐这气球四十年了。从没在白天见过那样的月亮。"),
  t("Don't stare at it too long. It almost looks like it's... moving.", "别盯着它看太久。它看起来几乎像是在……移动。"),
];

const BALLOON_GREETINGS_UNEASY_NIGHT = [
  t("Is it just me, or is the moon awfully close tonight?", "是我的错觉吗，今晚的月亮近得吓人？"),
  t("I've been watching the moon all evening. It's getting bigger. I'm sure of it.", "我整晚都在看月亮。它在变大。我确信。"),
  t("The stars look dimmer than usual. The moon is drowning them out.", "星星比平时暗。月亮把它们的光都盖住了。"),
  t("Beautiful night, isn't it? Almost too beautiful. The moon is enormous.", "美丽的夜晚，不是吗？美得几乎过头了。月亮大得惊人。"),
  t("My old bones are aching. They always do when the moon gets strange.", "我这把老骨头在疼。每当月亮变得古怪时它们就疼。"),
  t("That moon... it was half this size last night. I'd swear on my balloon.", "那月亮……昨晚只有这一半大。我敢拿我的气球发誓。"),
  t("The tides will be wild tonight. Look at the size of that thing.", "今晚潮水会很狂暴。瞧瞧那东西的大小。"),
  t("Something's not right up there. The moon doesn't just grow like that.", "上面有些不对劲。月亮不会那样平白无故地变大。"),
  t("I used to love full moons. This one gives me the shivers.", "我以前很爱满月。这一轮却让我发抖。"),
  t("Have you noticed? The moonlight is so bright it's casting double shadows.", "你注意到了吗？月光亮得能投下双重影子。"),
];

const BALLOON_GREETINGS_PANIC = [
  t("We need to land — RIGHT NOW!", "我们得降落——立刻！"),
  t("It's heading straight for us! Can't you see it?!", "它正朝我们直冲过来！你看不见吗？！"),
  t("This is the end, isn't it? Tell me it isn't.", "这就是终结了，对吧？告诉我不是。"),
  t("LOOK AT THE SKY! Why is nobody doing anything?!", "看看天空！为什么没人采取行动？！"),
  t("I can't breathe. The moon — it's so close I can see the craters.", "我喘不过气。月亮——它近得我都能看见环形山了。"),
  t("We're all going to... no. No no no no no.", "我们都要……不。不不不不不。"),
  t("Get away from here! Fly as far as you can!", "离开这儿！能飞多远飞多远！"),
  t("My balloon can't go fast enough. Nothing can.", "我的气球飞得不够快。什么都不够快。"),
  t("I always thought I'd go peacefully. Not like this.", "我一直以为自己会安详地离去。不是这样的。"),
  t("Someone PLEASE do something! It's almost here!", "谁来做点什么吧！它快到了！"),
  t("The whole world is shaking! Can you feel it?!", "整个世界都在颤抖！你感觉到了吗？！"),
  t("I can hear it. The sky is groaning. We're out of time.", "我能听见。天空在呻吟。我们没时间了。"),
  t("Forget the deliveries, forget everything — just RUN!", "别管送货了，别管一切了——快跑！"),
  t("Hold your loved ones close, pilot. There's no time left.", "把你爱的人抱紧，飞行员。没有时间了。"),
  t("If this is our last flight... it was nice meeting you.", "如果这是我们最后一次飞行……很高兴认识你。"),
];

const PANIC_LINES_GREMLINS = [
  t("Gremlins everywhere — as if the moon wasn't enough!", "到处都是小妖精——好像光有月亮还不够似的！"),
  t("The gremlins are laughing at us! I can hear them!", "小妖精在嘲笑我们！我能听见它们的笑声！"),
  t("I'd take a gremlin over that moon any day — at least gremlins are small!", "比起那月亮，我宁愿要小妖精——至少它们个头小！"),
];

const PANIC_LINES = [
  t("Did you see the size of that thing?! It's ENORMOUS!", "你看到那东西多大了吗？！它大得吓人！"),
  t("The moon! THE MOON! It's going to crush us all!", "月亮！那月亮！它要把我们全都压碎！"),
  t("I can't stop shaking. Look at the sky. LOOK AT IT!", "我抖个不停。看看天空。快看它！"),
  t("We're all doomed. Every last one of us.", "我们都完了。一个都跑不掉。"),
  t("Someone do something! Anyone! PLEASE!", "谁来做点什么吧！随便谁！求你们了！"),
  t("I told them this would happen! Nobody listened!", "我早说会这样的！没人听！"),
  t("The animals are fleeing. Even they know.", "动物们都在逃。连它们都知道。"),
  t("My house is crumbling from the tremors!", "我的房子在震动中坍塌了！"),
  t("Has anyone seen my children? Where are my children?!", "有人看见我的孩子了吗？我的孩子在哪里？！"),
  t("Pray. Just pray. There's nothing else we can do.", "祈祷吧。只能祈祷了。我们别无他法。"),
  t("It's so close I can feel the heat. Is that possible?!", "它近得我都能感到热气。这怎么可能？！"),
  t("This is a nightmare. Please let this be a nightmare.", "这是一场噩梦。但愿这只是一场噩梦。"),
  t("I should have told them I loved them more often.", "我本该更常告诉他们我爱他们。"),
  t("The ocean is pulling back from the shore. It's really happening.", "海水正从岸边退去。这真的发生了。"),
  t("If any pilot can hear me — is there any hope left?", "若有飞行员能听见我——还有希望吗？"),
];

/**
 * Random NPC + greeting line for balloon proximity (same portrait pool as package quests).
 * Uses Math.random() — the old seeded LCG often produced the same first draw (e.g. Old Barnaby)
 * for nearby seeds; balloon lines don’t need to match across clients.
 */
export function pickBalloonGreeting(
  _seed: number,
  _balloonIndex: number,
  _salt: number,
  moonProgress: number,
  isDay: boolean,
): { npcName: string; line: string } {
  const npcName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)]!;
  if (moonProgress < 0.75 && Math.random() < 0.14) {
    const line =
      BALLOON_GREETINGS_GREMLINS[
        Math.floor(Math.random() * BALLOON_GREETINGS_GREMLINS.length)
      ]!;
    return { npcName, line };
  }
  let pool: string[];
  if (moonProgress >= 0.75) {
    pool = BALLOON_GREETINGS_PANIC;
  } else if (moonProgress >= 0.5) {
    pool = isDay ? BALLOON_GREETINGS_UNEASY_DAY : BALLOON_GREETINGS_UNEASY_NIGHT;
  } else {
    pool = BALLOON_GREETINGS;
  }
  const line = pool[Math.floor(Math.random() * pool.length)]!;
  return { npcName, line };
}

export function pickPanicLine(): { npcName: string; line: string } {
  const npcName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)]!;
  const line = Math.random() < 0.22
    ? PANIC_LINES_GREMLINS[Math.floor(Math.random() * PANIC_LINES_GREMLINS.length)]!
    : PANIC_LINES[Math.floor(Math.random() * PANIC_LINES.length)]!;
  return { npcName, line };
}

/* ── Observatory astronomer dialogue ──────────────────────────────── */

const ASTRONOMER_NAMES = [
  "Professor Astrid",
  "Stargazer Orion",
  "Doctor Celeste",
] as const;

MALE_NPC_NAMES.add("Stargazer Orion");

const ASTRO_CALM = [
  t("The constellations are beautiful tonight. Have you seen Orion's belt?", "今晚的星座真美。你看到猎户座的腰带了吗？"),
  t("I've been charting the stars for years. Everything looks normal… for now.", "我绘制星图已有多年。一切看起来都正常……目前为止。"),
  t("Come to stargaze? The skies are perfectly clear up here.", "来观星的？这上面天空一片澄澈。"),
  t("I've been tracking a faint object near the horizon. Probably nothing.", "我一直在追踪地平线附近一个微弱的天体。多半没什么。"),
  t("The telescope is calibrated. All the stars are exactly where they should be.", "望远镜已校准。所有星星都恰好在它们该在的位置。"),
  t("There's a lovely nebula visible this evening. Care to look?", "今晚能看到一片可爱的星云。想看看吗？"),
];

const ASTRO_UNEASY = [
  t("Something is off with the star charts. A few constellations seem… shifted.", "星图有些不对劲。有几个星座似乎……移位了。"),
  t("I keep rechecking my calculations. There's an object that shouldn't be there.", "我一遍遍重算。有个天体本不该在那里。"),
  t("The moon looks a touch bigger than my almanac says it should.", "月亮看起来比我的天文历记载的要大一点点。"),
  t("I've sent word to the other observatories. They've noticed it too.", "我已通知了其他天文台。他们也注意到了。"),
  t("My instruments aren't wrong. Something is moving toward us.", "我的仪器没有出错。有什么东西正朝我们逼近。"),
  t("The readings were normal last week. Now they're anything but.", "上周读数还正常。现在却全然不是了。"),
];

const ASTRO_DREAD = [
  t("The moon is definitely closer. I can see new craters with the naked eye.", "月亮肯定更近了。我用肉眼都能看见新的环形山。"),
  t("I haven't slept in days. The readings are getting worse every hour.", "我好几天没睡了。读数每小时都在恶化。"),
  t("The tides have shifted. The ocean is pulling toward the sky.", "潮汐变了。海洋正被拉向天空。"),
  t("I've never seen anything like this in thirty years of astronomy.", "从事天文三十年，我从未见过这样的景象。"),
  t("If my calculations are right… we have very little time.", "如果我算得没错……我们时间不多了。"),
  t("The gravitational pull is increasing. My pendulum clock has stopped.", "引力在增强。我的摆钟停了。"),
];

const ASTRO_PANIC = [
  t("It's too late. The moon is falling. There's nothing we can do.", "太迟了。月亮正在坠落。我们无能为力。"),
  t("Get out of here! The sky is collapsing!", "离开这儿！天空正在崩塌！"),
  t("All my telescopes are shaking. The ground won't stop trembling.", "我所有的望远镜都在晃。地面震个不停。"),
  t("I'm so sorry. I should have warned everyone sooner.", "我很抱歉。我本该早点警告大家。"),
  t("Look at the sky. That isn't the moon anymore. It's the end.", "看看天空。那已不再是月亮了。是末日。"),
];

/** Plain-spoken hints: moonstones (two halves), gremlins — mixed in by chance. */
const ASTRO_MOONSTONE_GREMLIN = [
  t("The old moonstone sites — two pieces of one ring, buried on opposite sides of the world — show up weird on long exposures.", "古老的月光石遗址——同一枚指环的两块碎片，埋在世界的两端——在长曝光下显得很诡异。"),
  t("Gremlins aren't myth. I've tracked fast-moving dots that match pilot reports. Stay sharp up there.", "小妖精不是传说。我追踪到的快速移动光点与飞行员的报告吻合。在上面机灵点。"),
  t("If you ever fuse the moonstones, the readings go wild — then the braziers wake up. That's documented.", "你一旦融合月光石，读数就会失控——然后火盆就会苏醒。这是有记录的。"),
  t("The Gremlin King is the biggest gremlin in the sky flock. Astronomers don't put it in the journals, but pilots do.", "妖精王是天空群落里最大的小妖精。天文学家不会把它写进期刊，但飞行员会。"),
  t("Gremlins steal lift and scratch paint. The Gremlin King is the one that drops an eternal flame — if you can beat it.", "小妖精会偷走升力、刮花漆面。妖精王才是会掉永恒之火的那个——前提是你能打败它。"),
  t("Moonstone ruins: one half hums, the other answers. When both float, something bigger stirs.", "月光石遗迹：一半在低鸣，另一半在回应。当两块都漂浮时，更庞大之物便会苏动。"),
];

/**
 * Pick an observatory astronomer greeting based on moon progress.
 * @param observatoryIndex Which observatory (0–2) — determines the resident NPC.
 */
export function pickObservatoryGreeting(
  observatoryIndex: number,
  moonProgress: number,
): { npcName: string; line: string } {
  const npcName = ASTRONOMER_NAMES[observatoryIndex % ASTRONOMER_NAMES.length]!;
  if (moonProgress < 0.75 && Math.random() < 0.18) {
    const line =
      ASTRO_MOONSTONE_GREMLIN[
        Math.floor(Math.random() * ASTRO_MOONSTONE_GREMLIN.length)
      ]!;
    return { npcName, line };
  }
  let pool: readonly string[];
  if (moonProgress >= 0.75) pool = ASTRO_PANIC;
  else if (moonProgress >= 0.50) pool = ASTRO_DREAD;
  else if (moonProgress >= 0.25) pool = ASTRO_UNEASY;
  else pool = ASTRO_CALM;
  const line = pool[Math.floor(Math.random() * pool.length)]!;
  return { npcName, line };
}

/* ── Stonehenge whisper lines ─────────────────────────────────────── */

const STONEHENGE_CALM = [
  t("The stone circle hums. You hear a whisper... \"The stones remember when the sky was whole.\"", "石环在低鸣。你听见一声低语……「这些石头记得天空完好如初的时候。」"),
  t("Standing inside the stone circle, a vision stirs... lanterns floating upward, each one a prayer unanswered.", "站在石环之中，一个幻象浮现……灯笼向上飘升，每一盏都是一个未被回应的祈愿。"),
  t("Something is carved into the stone circle: \"When the moon swells, keep your eyes on the horizon.\"", "石环上刻着什么：「当月亮膨胀时，把目光投向地平线。」"),
  t("The stone circle resonates. You hear a whisper... \"They built this circle to watch the sky. They stopped watching.\"", "石环在共鸣。你听见一声低语……「他们建造这石环是为了守望天空。他们停止了守望。」"),
  t("The shadows cast by the stone circle always point toward the moon, no matter the hour.", "无论何时，石环投下的影子总是指向月亮。"),
  t("A clear carving names the moonstones: two halves of one ring, split across the world until someone joins them again.", "一段清晰的刻文道出了月光石之名：同一枚指环的两块，分散在世界各处，直到有人将它们重新合一。"),
  t("Someone scratched into the stone: gremlins in the clouds — small trouble. The moon is the big trouble.", "有人在石上刻道：云中的小妖精——小麻烦。月亮才是大麻烦。"),
];

const STONEHENGE_UNEASY = [
  t("The stone circle leans as if drawn toward something. A vision stirs... the moon, closer than it should be.", "石环倾斜着，仿佛被什么牵引。一个幻象浮现……月亮，近得超乎寻常。"),
  t("You hear a whisper from the stone circle... \"Count the stars between the pillars. There are fewer than before.\"", "你听见石环传来一声低语……「数数石柱之间的星星。比从前少了。」"),
  t("The ground around the stone circle vibrates faintly. An inscription reads: \"The circle holds as long as the sky does.\"", "石环周围的地面微微震动。一段刻文写道：「天空不塌，石环不倒。」"),
  t("A vision ripples through the stone circle... a constellation rearranging itself. One star missing.", "一个幻象在石环中荡漾……一个星座正在重新排列。缺了一颗星。"),
  t("You hear a whisper from the stones... \"Do not mistake warning for rescue.\"", "你听见石头传来一声低语……「别把警告误认作救赎。」"),
  t("Words appear in the dust: light the five braziers with eternal flame — real eternal flame — and the moon can be stopped for good.", "尘土中浮现文字：用永恒之火点燃五座火盆——真正的永恒之火——月亮便能被永远阻止。"),
  t("The stone remembers gremlins swarming like gnats. The Gremlin King, it says, was always a cousin to the moon's fall.", "石头记得小妖精像蚊蚋般成群。它说，妖精王一直都是月亮坠落的同宗。"),
];

const STONEHENGE_DREAD = [
  t("You hear a whisper from the stone circle... \"The last keeper saw it coming. Seeing changed nothing.\"", "你听见石环传来一声低语……「最后一位守护者预见了它的到来。预见改变不了什么。」"),
  t("A vision tears through the stone circle... the moon filling the entire sky. Someone screaming. Then silence.", "一个幻象撕裂了石环……月亮填满了整片天空。有人在尖叫。然后归于死寂。"),
  t("The air inside the stone circle is wrong. An inscription reads: \"Do not look up. Do not look up.\"", "石环内的空气不对劲。一段刻文写道：「不要抬头。不要抬头。」"),
  t("You hear a whisper from the stones... \"Run. There is nowhere to run. Fly then. Fly as far as you can.\"", "你听见石头传来一声低语……「逃吧。无处可逃。那就飞吧。能飞多远飞多远。」"),
  t("A vision stirs inside the stone circle... prayers rising into the dark. The moon keeps coming.", "一个幻象在石环中浮现……祈祷声升入黑暗。月亮仍在逼近。"),
  t("The carving shouts: find five braziers, keep the eternal flames burning — not the cheap kind. The Gremlin King kind.", "刻文在呐喊：找到五座火盆，让永恒之火燃烧——不是廉价的那种。是妖精王的那种。"),
  t("The stones say: moonstone first, braziers second. The world is a machine with missing instructions.", "石头说：先月光石，后火盆。这世界是一台缺了说明书的机器。"),
];

const STONEHENGE_PANIC = [
  t("You hear a whisper from the stone circle... \"Too late. Too late. Too--\"", "你听见石环传来一声低语……「太迟了。太迟了。太——」"),
  t("The stone circle is cracking. An inscription reads: \"We tried. We are sorry.\"", "石环正在崩裂。一段刻文写道：「我们尽力了。我们很抱歉。」"),
  t("A vision tears open inside the stone circle... the moon above the globe, close enough to touch. Then nothing.", "一个幻象在石环中撕裂开来……月亮悬于大地之上，近得触手可及。然后什么都没有了。"),
  t("You hear a whisper from the stones... \"Fly. Just fly. Don't stop.\"", "你听见石头传来一声低语……「飞吧。只管飞。别停下。」"),
  t("Even the gremlins have gone quiet. And the moonstone halves feel hot through the ground.", "连小妖精都安静了。隔着地面都能感到月光石两块碎片的灼热。"),
];

/* ── Brazier whisper lines ───────────────────────────────────────── */

/** Approaching an extinguished brazier — ancient, dormant. */
const BRAZIER_UNLIT = [
  t("The brazier's iron is cold. An inscription reads: \"Five fires hold the veil. Let them go dark and the sky opens.\"", "火盆的铁身冰冷。一段刻文写道：「五团火维系着帷幕。任它们熄灭，天空便会洞开。」"),
  t("The wood inside has turned to stone. Carved into the bowl: \"Do not let it go dark.\"", "里面的木柴已化作石头。盆内刻着：「不要让它熄灭。」"),
  t("Lichen covers the metal. Beneath it: \"Five flames, one shield. Against what comes from beyond the stars.\"", "地衣覆盖着金属。其下刻着：「五团火焰，一道护盾。抵御来自群星之外的东西。」"),
  t("A voice, not quite heard: \"We placed these five across the world. We did not tell anyone why. We should have.\"", "一个似有若无的声音：「我们把这五座布置在世界各处。我们没告诉任何人缘由。我们本该说的。」"),
  t("The brazier has not burned in a very long time. The air around it smells faintly of something that has no name.", "这火盆已许久未曾燃烧。它周围的空气隐隐散发着某种无以名状之物的气味。"),
  t("A newer plaque, in plain letters: \"Gremlins in the sky are a nuisance. The moon is the war. Light these five.\"", "一块较新的牌匾，朴素地写着：「天上的小妖精只是滋扰。月亮才是战争。点燃这五座。」"),
  t("Someone scratched: eternal flame — the blue kind from the Gremlin King — never goes out. Use it here.", "有人刻道：永恒之火——来自妖精王的那种蓝色火焰——永不熄灭。在这里用它。"),
];

/** Approaching a lit brazier when only 1–2 total are burning — the network stirs. */
const BRAZIER_LIT_FEW = [
  t("The brazier burns. Something in the flame whispers... \"One down. Four to find. The veil thins slower now.\"", "火盆燃烧着。火焰中有什么在低语……「一座点亮了。还有四座要找。帷幕变薄得慢些了。」"),
  t("The flame casts no shadow. An inscription glows: \"Light all five before it arrives.\"", "火焰不投下影子。一段刻文发出微光：「在它到来之前点燃全部五座。」"),
  t("You hear something in the crackling... \"They are watching. Whatever built the veil watches you light it back.\"", "你在噼啪声中听见了什么……「它们在注视。无论是谁建起了帷幕，都在看你将它重新点燃。」"),
  t("The flame burns upward even when the wind says otherwise. The other four are out there, cold and waiting.", "即便风向相反，火焰仍向上燃烧。另外四座就在外面，冰冷地等待着。"),
  t("Standing near the fire, you feel a warmth that isn't entirely from the flame. The brazier hums.", "站在火旁，你感到一股暖意，并不全然来自火焰。火盆在低鸣。"),
  t("This fire is ordinary — it will go out. An eternal flame from a Gremlin King would stay forever.", "这火很普通——它会熄灭。来自妖精王的永恒之火则会永远燃烧。"),
  t("Gremlins hate the cold braziers. Good luck getting gremlins to help, though.", "小妖精讨厌冰冷的火盆。不过，想让小妖精帮忙，祝你好运。"),
];

/** Approaching any brazier when 3–4 are burning — urgency rises. */
const BRAZIER_LIT_MANY = [
  t("The air feels charged. An inscription: \"When four burn, the fifth must follow. The interval matters.\"", "空气中弥漫着张力。一段刻文：「四座燃起时，第五座必须紧随。间隔至关重要。」"),
  t("The flame leans toward the sky, as if pointing at something above.", "火焰朝天空倾斜，仿佛在指向上方的某物。"),
  t("The brazier flickers faster as you approach. You hear, barely: \"Almost. Almost. Do not stop now.\"", "你靠近时，火盆闪烁得更快。你勉强听见：「快了。快了。现在别停下。」"),
  t("You sense the other fires from here — a thread of heat connecting them across the world. One gap remains.", "你在此处感知到其他几团火——一缕热流跨越世界将它们相连。还剩一处缺口。"),
  t("Half-buried inscription: \"The ancients lit all five in one hour. They are not here to say what happened next.\"", "半埋的刻文：「先民在一小时内点燃了全部五座。他们没能留下来诉说之后发生了什么。」"),
  t("Three or four lit — keep going. If you have eternal flame left, save it for the last braziers.", "点亮了三四座——继续。如果你还剩永恒之火，留给最后几座火盆。"),
  t("The moon feels closer when most braziers burn. Gremlins get louder too. Coincidence.", "大多数火盆燃起时，月亮仿佛更近了。小妖精也更吵了。巧合罢了。"),
];

/** Approaching any brazier when all 5 are burning — the shield holds. */
const BRAZIER_ALL_LIT = [
  t("All five burn. The air above the globe feels heavier. Like something is pressing against it. Or pressing away.", "五座全都燃起。大地之上的空气变得更沉。仿佛有什么在压向它。或是在向外推。"),
  t("The flame is still. The inscription reads: \"You have done what we could not. We do not know if it will be enough.\"", "火焰静止不动。刻文写道：「你做到了我们未能做到的事。我们不知道这是否足够。」"),
  t("A hum runs through the ground — faint, global, old. The veil holds. For now.", "一阵低鸣贯穿大地——微弱、遍及全球、古老。帷幕守住了。暂时而已。"),
  t("\"The shield is not a wall — it is a warning. Whatever it keeps out knows it is there.\"", "「这护盾不是一堵墙——它是一个警告。被它挡在外面的东西知道它的存在。」"),
  t("The flame burns cold. An inscription glows: \"Five fires, one breath. Hold it.\"", "火焰冷冷燃烧。一段刻文发出微光：「五团火，一口气。屏住它。」"),
  t("All five braziers are lit — the moon should slow down. If you used eternal flame on each, it lasts forever.", "五座火盆全点亮了——月亮应当会减速。若你在每座都用了永恒之火，它便永不熄灭。"),
];

/** All five burning with eternal flame; moon stopped for good. */
const BRAZIER_ALL_ETERNAL_VICTORY = [
  t("Every flame is an eternal flame. The moon has stopped. The inscription says: the world is saved.", "每一团火都是永恒之火。月亮停住了。刻文写道：世界得救了。"),
  t("Five blue eternal flames. The Gremlin King would be proud. The moon hangs frozen in the sky.", "五团蓝色的永恒之火。妖精王会感到骄傲。月亮凝固在天空中。"),
  t("You did it. Eternal flame on all five braziers. The moon won't fall again.", "你做到了。五座火盆都燃着永恒之火。月亮不会再坠落了。"),
];

/** Context from Game (save + runtime brazier state). */
export interface BrazierWhisperContext {
  eternalFlameInInventory: boolean;
  allFiveEternalLit: boolean;
  moonFrozenForever: boolean;
  gremlinKingDefeated: boolean;
}

/**
 * Pick a brazier ambient whisper.
 * @param isLit   Whether the brazier being approached is currently burning.
 * @param litCount How many of the 5 braziers are currently burning.
 */
export function pickBrazierWhisper(
  isLit: boolean,
  litCount: number,
  context?: BrazierWhisperContext,
): string {
  if (context?.moonFrozenForever && litCount >= 5 && Math.random() < 0.38) {
    return BRAZIER_ALL_ETERNAL_VICTORY[
      Math.floor(Math.random() * BRAZIER_ALL_ETERNAL_VICTORY.length)
    ]!;
  }
  if (context?.allFiveEternalLit && litCount >= 5 && Math.random() < 0.32) {
    return BRAZIER_ALL_ETERNAL_VICTORY[
      Math.floor(Math.random() * BRAZIER_ALL_ETERNAL_VICTORY.length)
    ]!;
  }
  if (
    context?.gremlinKingDefeated &&
    context.eternalFlameInInventory &&
    litCount < 5 &&
    Math.random() < 0.22
  ) {
    return t("You carry an eternal flame from the Gremlin King. Light a brazier with it — it never burns out.", "你带着一团来自妖精王的永恒之火。用它点燃一座火盆——它永不熄灭。");
  }
  if (context?.eternalFlameInInventory && litCount < 5 && Math.random() < 0.18) {
    return t("You have an eternal flame in your pack. Use it at a brazier — the flame stays forever.", "你的包里有一团永恒之火。在火盆处使用它——这火焰会永远燃烧。");
  }

  let pool: readonly string[];
  if (litCount >= 5)       pool = BRAZIER_ALL_LIT;
  else if (litCount >= 3)  pool = BRAZIER_LIT_MANY;
  else if (isLit)          pool = BRAZIER_LIT_FEW;
  else                     pool = BRAZIER_UNLIT;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Pick a stonehenge ambient whisper line based on moon progress. */
export function pickStonehengeWhisper(moonProgress: number): string {
  let pool: readonly string[];
  if (moonProgress >= 0.75) pool = STONEHENGE_PANIC;
  else if (moonProgress >= 0.50) pool = STONEHENGE_DREAD;
  else if (moonProgress >= 0.25) pool = STONEHENGE_UNEASY;
  else pool = STONEHENGE_CALM;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
