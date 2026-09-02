import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "zh" | "ru";

const LANG_KEY = "jixiang_lang";

/** 顾客端文案字典 */
const dict = {
  // 导航
  myOrders: { zh: "我的订单", ru: "Мои заказы" },
  cart: { zh: "购物车", ru: "Корзина" },
  login: { zh: "登录 / 注册", ru: "Войти" },
  logout: { zh: "退出", ru: "Выйти" },
  restaurantSub: { zh: "俄 中 餐 厅", ru: "РЕСТОРАН" },
  // 首页 banner
  heroKicker: { zh: "РУССКО · КИТАЙСКАЯ КУХНЯ", ru: "РУССКАЯ · КИТАЙСКАЯ КУХНЯ" },
  heroTitle: { zh: "吉祥俄中餐厅", ru: "Ресторан «Цзисян»" },
  heroDesc: {
    zh: "红菜汤遇见锅包肉，大列巴配格瓦斯——俄式豪迈与中式家常，一站点齐。支持外卖送上门与到店自取。",
    ru: "Борщ встречает гобаожоу, хлеб с квасом — русский размах и китайский домашний уют в одном месте. Доставка и самовывоз.",
  },
  // 菜单
  all: { zh: "全部", ru: "Все" },
  addToCart: { zh: "加入购物车", ru: "В корзину" },
  addedToCart: { zh: "已加入购物车", ru: "Добавлено в корзину" },
  menuLoadFail: {
    zh: "菜单加载失败，请稍后重试。目前访问人数较多时，请 5 分钟后再试。",
    ru: "Не удалось загрузить меню. Попробуйте через 5 минут.",
  },
  emptyTag: { zh: "该标签下暂时没有菜品", ru: "В этой категории пока нет блюд" },
  loading: { zh: "加载中…", ru: "Загрузка…" },
  // 标签名
  tag热销: { zh: "热销", ru: "Хит" },
  tag新品: { zh: "新品", ru: "Новинка" },
  tag素食: { zh: "素食", ru: "Вег." },
  tag辣: { zh: "辣", ru: "Острое" },
  tag推荐: { zh: "推荐", ru: "Советуем" },
  tag俄式经典: { zh: "俄式经典", ru: "Русская классика" },
  tag中式经典: { zh: "中式经典", ru: "Китайская классика" },
  // 分类名
  cat汤类: { zh: "汤类", ru: "Супы" },
  cat俄式主菜: { zh: "俄式主菜", ru: "Русские блюда" },
  cat中式热菜: { zh: "中式热菜", ru: "Китайские блюда" },
  cat凉菜小吃: { zh: "凉菜小吃", ru: "Закуски" },
  cat主食: { zh: "主食", ru: "Основное" },
  cat甜品饮品: { zh: "甜品饮品", ru: "Десерты и напитки" },
  cat其他: { zh: "其他", ru: "Прочее" },
  // 购物车 / 下单
  cartTitle: { zh: "购物车与下单", ru: "Корзина и заказ" },
  cartEmpty: { zh: "购物车还是空的", ru: "Корзина пуста" },
  goMenu: { zh: "去逛逛菜单", ru: "К меню" },
  dishDetails: { zh: "菜品明细", ru: "Состав заказа" },
  perServing: { zh: "/ 份", ru: "/ порц." },
  total: { zh: "合计", ru: "Итого" },
  fulfillmentTitle: { zh: "履约方式", ru: "Способ получения" },
  delivery: { zh: "外卖送上门", ru: "Доставка" },
  pickup: { zh: "到店自取", ru: "Самовывоз" },
  pickupHint: {
    zh: "下单后请留意订单状态，状态变为「待自取」后即可到店取餐。",
    ru: "Следите за статусом: когда появится «Готово к выдаче», приходите в ресторан.",
  },
  contactName: { zh: "联系人", ru: "Контактное лицо" },
  phone: { zh: "联系电话", ru: "Телефон" },
  province: { zh: "省份", ru: "Регион" },
  city: { zh: "城市", ru: "Город" },
  district: { zh: "区 / 县", ru: "Район" },
  detailAddress: { zh: "详细地址", ru: "Адрес" },
  detailAddressPh: { zh: "街道、小区、楼栋、门牌号", ru: "Улица, дом, квартира" },
  remark: { zh: "备注（可选）", ru: "Комментарий" },
  remarkPh: { zh: "口味偏好、过敏原提示等", ru: "Пожелания, аллергии и т.д." },
  submitOrder: { zh: "提交订单", ru: "Оформить заказ" },
  submitting: { zh: "提交中…", ru: "Отправка…" },
  needLogin: { zh: "请先登录后再下单", ru: "Сначала войдите в аккаунт" },
  fillAddress: { zh: "请完整填写配送地址信息", ru: "Заполните адрес доставки полностью" },
  orderSuccess: { zh: "下单成功！订单号", ru: "Заказ создан! №" },
  // 订单页
  ordersTitle: { zh: "我的订单", ru: "Мои заказы" },
  noOrders: { zh: "还没有订单", ru: "Заказов пока нет" },
  goOrder: { zh: "去点餐", ru: "Заказать" },
  viewDetail: { zh: "查看详情", ru: "Подробнее" },
  goPay: { zh: "去付款", ru: "Оплатить" },
  loginToView: { zh: "登录后即可查看您的订单", ru: "Войдите, чтобы увидеть заказы" },
  goLogin: { zh: "去登录", ru: "Войти" },
  orderNo: { zh: "订单", ru: "Заказ" },
  addressTitle: { zh: "配送地址", ru: "Адрес доставки" },
  remarkLabel: { zh: "备注", ru: "Комментарий" },
  orderedAt: { zh: "下单时间", ru: "Создан" },
  paidAtLabel: { zh: "付款时间", ru: "Оплачен" },
  confirmPayTitle: { zh: "确认付款", ru: "Подтверждение оплаты" },
  confirmPayDesc: {
    zh: "当前为线下付款模式。请通过店内公示的方式转账，完成后点击下方按钮标记已付款，餐厅会核对到账情况。",
    ru: "Оплата офлайн: переведите сумму способом, указанным в ресторане, затем нажмите кнопку ниже.",
  },
  thinkAgain: { zh: "再想想", ru: "Отмена" },
  iHavePaid: { zh: "我已完成付款", ru: "Я оплатил(а)" },
  paidMarked: { zh: "已标记为已付款", ru: "Отмечено как оплачено" },
  // 登录 / 注册
  welcome: { zh: "欢迎光临", ru: "Добро пожаловать" },
  loginHint: { zh: "使用邮箱登录或注册，开始点餐", ru: "Войдите или зарегистрируйтесь по email" },
  loginTab: { zh: "登录", ru: "Вход" },
  registerTab: { zh: "注册", ru: "Регистрация" },
  email: { zh: "邮箱", ru: "Email" },
  password: { zh: "密码", ru: "Пароль" },
  passwordRule: { zh: "密码（至少 6 位）", ru: "Пароль (мин. 6 символов)" },
  confirmPassword: { zh: "确认密码", ru: "Повторите пароль" },
  name: { zh: "姓名", ru: "Имя" },
  phoneNumber: { zh: "手机号", ru: "Телефон" },
  loggingIn: { zh: "登录中…", ru: "Вход…" },
  doLogin: { zh: "登录", ru: "Войти" },
  registering: { zh: "注册中…", ru: "Регистрация…" },
  doRegister: { zh: "注册并登录", ru: "Создать аккаунт" },
  loginOk: { zh: "登录成功", ru: "Вы вошли" },
  registerOk: { zh: "注册成功，已自动登录", ru: "Регистрация завершена" },
  pwdTooShort: { zh: "密码至少 6 位", ru: "Пароль не короче 6 символов" },
  pwdMismatch: { zh: "两次输入的密码不一致", ru: "Пароли не совпадают" },
  adminEntry: { zh: "餐厅管理员请前往", ru: "Для администраторов:" },
  adminLink: { zh: "管理后台入口", ru: "панель управления" },
  // 状态
  st_pending: { zh: "待确认", ru: "Ожидает" },
  st_preparing: { zh: "备餐中", ru: "Готовится" },
  st_awaiting_pickup: { zh: "待自取", ru: "К выдаче" },
  st_delivering: { zh: "配送中", ru: "В пути" },
  st_completed: { zh: "已完成", ru: "Завершён" },
  st_cancelled: { zh: "已取消", ru: "Отменён" },
  pay_unpaid: { zh: "待付款", ru: "Не оплачен" },
  pay_paid: { zh: "已付款", ru: "Оплачен" },
  pay_refunded: { zh: "已退款", ru: "Возврат" },
  fm_delivery: { zh: "外卖送上门", ru: "Доставка" },
  fm_pickup: { zh: "到店自取", ru: "Самовывоз" },
} as const;

export type DictKey = keyof typeof dict;

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  categoryName: (cat: string) => string;
  tagName: (tag: { name: string }) => string;
  dishName: (dish: { name: string; nameRu?: string | null }) => string;
  dishDesc: (dish: { description?: string | null; descriptionRu?: string | null }) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    localStorage.getItem(LANG_KEY) === "ru" ? "ru" : "zh",
  );

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "ru" ? "ru" : "zh-CN";
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const t = (key: DictKey) => dict[key][lang];
    const catKey = (cat: string) => `cat${cat}` as DictKey;
    return {
      lang,
      setLang: setLangState,
      t,
      categoryName: (cat) => (catKey(cat) in dict ? t(catKey(cat)) : cat),
      tagName: (tag) => {
        const key = `tag${tag.name}` as DictKey;
        return key in dict ? t(key) : tag.name;
      },
      dishName: (d) => (lang === "ru" && d.nameRu ? d.nameRu : d.name),
      dishDesc: (d) => (lang === "ru" && d.descriptionRu ? d.descriptionRu : d.description) ?? "",
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** 订单状态 / 付款状态 / 履约方式 的本地化标签（顾客端用） */
export function localizedOrderStatus(status: string, lang: Lang): string {
  const key = `st_${status}` as DictKey;
  return key in dict ? dict[key][lang] : status;
}
export function localizedPaymentStatus(status: string, lang: Lang): string {
  const key = `pay_${status}` as DictKey;
  return key in dict ? dict[key][lang] : status;
}
export function localizedFulfillment(fm: string, lang: Lang): string {
  const key = `fm_${fm}` as DictKey;
  return key in dict ? dict[key][lang] : fm;
}
