<template>
  <Teleport to="body">
    <div class="disclaimer-backdrop">
      <section class="disclaimer-panel" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
        <header class="disclaimer-header">
          <div class="disclaimer-title-group">
            <div class="disclaimer-badge-row">
              <span class="header-badge">18+ 成年限定</span>
              <span class="header-badge header-badge-soft">首次访问需确认</span>
            </div>
            <p class="disclaimer-kicker">Entry Compliance Notice</p>
            <h1 id="disclaimer-title">LINK小手机使用声明</h1>
          </div>

          <div class="disclaimer-progress-card" aria-label="阅读进度">
            <span>STEP</span>
            <strong>{{ stepNumber }}</strong>
            <small>/ {{ totalSteps }}</small>
          </div>
        </header>

        <div class="disclaimer-track-shell">
          <div class="disclaimer-track" :style="trackStyle">
            <article v-for="step in steps" :key="step.title" class="disclaimer-step">
              <div class="step-head">
                <h2>{{ step.title }}</h2>
                <p class="step-summary">{{ step.summary }}</p>
              </div>

              <div class="step-markers" aria-label="重点提示">
                <span v-for="marker in step.markers" :key="marker" class="step-marker">{{ marker }}</span>
              </div>

              <div class="clause-list">
                <section v-for="clause in step.clauses" :key="clause.label" class="clause-card" :class="`tone-${clause.tone}`">
                  <p class="clause-label">{{ clause.label }}</p>
                  <p class="clause-body">{{ clause.body }}</p>
                </section>
              </div>

              <div v-if="step.notice" class="step-notice" :class="`tone-${step.noticeTone ?? 'neutral'}`">
                <span class="notice-title">重点说明</span>
                <p>{{ step.notice }}</p>
              </div>
            </article>

            <article class="disclaimer-step disclaimer-step-confirm">
              <div class="step-head">
                <h2>完成入站声明后进入</h2>
                <p class="step-summary">
                  系统仅在首次打开网站时显示本流程。完成确认后，将记录你已阅读、理解并同意全部条款。
                </p>
              </div>

              <div class="confirm-checklist">
                <section v-for="item in confirmChecklist" :key="item.title" class="confirm-note-card">
                  <p class="confirm-note-title">{{ item.title }}</p>
                  <p class="confirm-note-body">{{ item.body }}</p>
                </section>
              </div>

              <div class="confirm-quote">
                <p class="quote-label">请逐字输入以下完整声明</p>
                <p class="quote-text">{{ confirmationText }}</p>
              </div>

              <label class="confirm-field">
                <span>确认输入</span>
                <textarea
                  v-model="typedConfirmation"
                  rows="6"
                  placeholder="请逐字输入完整声明，不可缺字或改字"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                />
              </label>

              <p v-if="typedConfirmation && !isConfirmationMatched" class="confirm-hint confirm-hint-error">
                输入内容需与上方声明完全一致后方可进入。
              </p>
              <p v-else-if="typedConfirmation && isConfirmationMatched" class="confirm-hint confirm-hint-success">
                声明内容校验通过，可在阅读计时结束后确认进入。
              </p>
            </article>

            <article class="disclaimer-step disclaimer-step-social">
              <section class="social-shell social-shell-realistic">
                <header class="social-app-header">
                  <button type="button" class="social-header-support" @click="contactLinkSupport">联系 LINK 客服反馈</button>
                  <span class="social-status-pill" :class="`tone-${socialFeedbackKind}`">{{ socialStatusBadge }}</span>
                </header>

                <div class="auth-tab-row" role="tablist" aria-label="登录方式">
                  <button type="button" class="auth-tab" :class="{ active: socialTab === 'login' }" @click="switchSocialTab('login')">登录</button>
                  <button type="button" class="auth-tab" :class="{ active: socialTab === 'register' }" @click="switchSocialTab('register')">注册</button>
                  <button type="button" class="auth-tab" :class="{ active: socialTab === 'other' }" @click="switchSocialTab('other')">其他登录</button>
                </div>

                <section v-if="socialTab === 'login'" class="auth-card auth-card-realistic">
                  <p class="auth-card-title">登录账号</p>
                  <p class="auth-card-copy">请输入账号和密码以继续访问 LINK </p>

                  <label class="auth-field">
                    <span>用户名</span>
                    <input v-model="loginUsername" type="text" placeholder="请输入用户名" autocomplete="off" />
                  </label>

                  <label class="auth-field">
                    <span>密码</span>
                    <input v-model="loginPassword" type="password" placeholder="请输入密码" autocomplete="off" />
                  </label>

                  <div class="auth-inline-actions">
                    <button type="button" class="auth-link-button" @click="switchSocialTab('register')">注册账号</button>
                    <span class="auth-inline-note">登录即视为同意服务协议与隐私说明</span>
                  </div>

                  <button type="button" class="social-primary-button social-primary-button-dark" @click="submitLogin">登录</button>
                </section>

                <section v-else-if="socialTab === 'register'" class="auth-card auth-card-realistic">
                  <p class="auth-card-title">创建账号</p>
                  <p class="auth-card-copy">注册后可在此设备使用你的 LINK </p>

                  <label class="auth-field">
                    <span>用户名</span>
                    <input v-model="registerUsername" type="text" placeholder="请输入用户名" autocomplete="off" />
                  </label>

                  <label class="auth-field">
                    <span>密码</span>
                    <input v-model="registerPassword" type="password" placeholder="请输入密码" autocomplete="off" />
                  </label>

                  <div class="auth-inline-actions">
                    <button type="button" class="auth-link-button" @click="switchSocialTab('login')">返回登录</button>
                    <span class="auth-inline-note">注册即视为同意服务协议与隐私说明</span>
                  </div>

                  <button type="button" class="social-primary-button social-primary-button-dark" @click="submitRegister">立即注册</button>
                </section>

                <section v-else class="auth-card auth-card-other auth-card-realistic">
                  <p class="auth-card-title">其他方式登录</p>
                  <p class="auth-card-copy">完成授权后将自动检查 GitHub 云端备份，并恢复或绑定当前 LINK 账号。</p>

                  <button type="button" class="oauth-button github oauth-button-primary" :disabled="githubLinkBusy" @click="openGitHubSocialLogin">
                    <span>继续使用 GitHub</span>
                    <small>同步备份记录与自动备份配置</small>
                  </button>

                  <div class="social-provider-divider">
                    <span></span>
                    <strong>其他登录方式</strong>
                    <span></span>
                  </div>

                  <div class="social-provider-grid">
                    <button type="button" class="provider-chip" @click="triggerProviderReply('wechat')">
                      <span class="provider-icon">微</span>
                      <small>微信登录</small>
                    </button>
                    <button type="button" class="provider-chip" @click="triggerProviderReply('qq')">
                      <span class="provider-icon">Q</span>
                      <small>QQ 登录</small>
                    </button>
                    <button type="button" class="provider-chip" @click="triggerProviderReply('apple')">
                      <span class="provider-icon">A</span>
                      <small>Apple</small>
                    </button>
                  </div>

                  <p class="other-login-note">GitHub 登录成功后会优先尝试恢复云端备份；如果未发现备份记录，则自动绑定当前自动备份仓库。</p>
                </section>

                <p v-if="socialFeedback" class="social-feedback social-feedback-banner" :class="`tone-${socialFeedbackKind}`">{{ socialFeedback }}</p>
              </section>
            </article>
          </div>
        </div>

        <div class="disclaimer-dots" aria-hidden="true">
          <span
            v-for="(step, index) in totalSteps"
            :key="step"
            :class="['dot', { active: index === activeStep }]"
          />
        </div>

        <footer class="disclaimer-footer">
          <div class="countdown-copy" :class="{ ready: !showCountdown }">
            <span v-if="showCountdown">本页阅读计时剩余 {{ remainingSeconds }} 秒，计时结束后方可继续</span>
            <span v-else-if="isSocialStep">{{ socialStepFooterCopy }}</span>
            <span v-else>{{ activeStep < steps.length ? '本页阅读已完成，可继续下一项条款' : '阅读已完成，输入声明无误后即可继续最后一页' }}</span>
          </div>

          <div class="footer-actions">
            <button class="secondary-action disclaimer-button" type="button" :disabled="activeStep === 0" @click="goPrev">
              返回上一项
            </button>
            <button
              class="primary-action disclaimer-button disclaimer-button-primary"
              type="button"
              :disabled="isNextDisabled"
              @click="handleNext"
            >
              {{ footerPrimaryLabel }}
            </button>
          </div>
        </footer>
      </section>

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { buildGitHubLoginUrl, ensureGitHubBackupRepository, getGitHubOAuthWorkerOrigin } from '@/services/githubBackup';
import { useAppStore } from '@/stores/appStore';

type StepClauseTone = 'neutral' | 'warn' | 'danger';

interface StepClause {
  label: string;
  body: string;
  tone?: StepClauseTone;
}

interface DisclaimerStep {
  title: string;
  summary: string;
  markers: string[];
  clauses: StepClause[];
  notice?: string;
  noticeTone?: StepClauseTone;
}

interface GitHubOAuthMessage {
  type: 'link:github-oauth';
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  error?: string;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const store = useAppStore();

const confirmationText = '本人已满十八周岁，已完整阅读并理解以上全部使用条款，知悉权责，同意所有条款，确认使用。';

const steps: DisclaimerStep[] = [
  {
    title: ' 开源网站相关说明',
    summary: '本项目属于个人非盈利开源技术演示，仅展示前端交互能力与第三方 AI 接口接入效果，不构成任何官方产品或商业服务。',
    markers: ['非盈利性质', '无充值与变现行为', '与 LINE 无授权关联'],
    clauses: [
      {
        label: '网站定位',
        body: '本站部署于 GitHub Pages 公共平台，整体运营不含商业广告、付费充值、赞赏打赏、流量变现、外部导流等任何盈利性安排。'
      },
      {
        label: '功能边界',
        body: '网站功能仅由前端页面调用外部第三方 AI 开放接口，以实现交互式角色扮演场景的技术演示；本站并未自建模型服务。'
      },
      {
        label: '品牌关系',
        body: '本站并非 LINE 官方研发、授权或运营产品，与相关企业不存在合作开发、商标授权、品牌挂靠、隶属关系或其他形式的官方关联。',
        tone: 'warn'
      },
      {
        label: '界面来源',
        body: '页面仅参考通用即时通讯界面的基础交互逻辑进行原创设计，未盗用、复刻或冒用第三方受保护商标、图标、美术素材及专属界面样式。'
      }
    ],
    notice: '如你对品牌来源、官方属性或服务归属存在疑问，应以本页声明为准，不得将本站误认作任何第三方企业的官方产品。',
    noticeTone: 'warn'
  },
  {
    title: '年龄使用限制条款',
    summary: '本站仅向年满 18 周岁且具备完全民事行为能力的成年人开放，未成年人不得访问、浏览或使用本站任何功能。',
    markers: ['仅限成年人使用', '需具备完全民事行为能力', '监护责任不由项目承担'],
    clauses: [
      {
        label: '适用对象',
        body: '只有已满法定十八周岁、能够独立承担民事法律后果的用户，方可继续使用本站服务。',
        tone: 'warn'
      },
      {
        label: '未成年人禁止进入',
        body: '未成年人严禁在未取得监护人许可的情况下访问、浏览、使用本站全部功能板块。'
      },
      {
        label: '责任承担',
        body: '若未成年人擅自进入本站，并因虚拟剧情内容引发心理、家庭、人身或法律争议，由未成年人本人及其法定监护人自行承担全部后果与责任。',
        tone: 'danger'
      },
      {
        label: '确认效力',
        body: '用户继续完成本流程并输入最终声明，即视为本人已如实确认年龄达标、心智完整，且能够独立承担使用本站产生的一切法律后果。'
      }
    ],
    notice: '若年龄条件不符合，请立即停止访问本站并关闭页面。',
    noticeTone: 'danger'
  },
  {
    title: '倒卖禁止与侵权追责说明',
    summary: '项目源码、原创排版、站内文案、提示词模板与交互逻辑等均受法律保护，仅可在个人自学、技术研究、非商用参考范围内使用。',
    markers: ['禁止倒卖与改包售卖', '禁止冒充原版传播', '侵权将保留追责权利'],
    clauses: [
      {
        label: '权利归属',
        body: '本项目完整前端源代码、页面原创结构、文案内容、提示词模板、配置文件及整体汇编内容，均由项目开发者独立构思并创作完成，自创作完成之日起依法享有完整著作权。'
      },
      {
        label: '允许范围',
        body: '开源仅意味着你可以在个人自学、技术研究、非商用参考的前提下查阅与学习源码，不意味着你获得对项目资源的再分发、打包出售或商业运营许可。'
      },
      {
        label: '明确禁止',
        body: '严禁复制、二次封装、改包售卖、付费代搭建、私发资源、倒卖角色配置、篡改项目名称或声明后冒充原版对外传播及接单商用。',
        tone: 'danger'
      },
      {
        label: '侵权后果',
        body: '对于未经许可的倒卖、商用篡改、侵权传播及借项目从事诈骗、灰产引流等行为，项目开发者有权保留完整证据并向平台投诉、要求下架、封禁、停止侵害以及主张民事赔偿。',
        tone: 'danger'
      }
    ],
    notice: '若行为触及治安管理或刑事法律风险，相关罚款、拘留、立案与审判后果均由实施人独立承担。',
    noticeTone: 'danger'
  },
  {
    title: '用户输入内容权责划分',
    summary: '角色设定、对话文本、剧情指令均由用户主动输入，AI 回复由外部第三方服务生成；用户需对输入与传播的全部内容独立负责。',
    markers: ['用户自行编辑内容', '外部 AI 生成回复', '违规传播责任自负'],
    clauses: [
      {
        label: '输入来源',
        body: '站内角色资料、聊天内容与剧情指令均由用户本人自主创建与输入，后续对话由外部第三方 AI 服务器运算生成。'
      },
      {
        label: '平台能力边界',
        body: '本站不储存用户聊天记录，也未自建或部署 AI 大模型，无法对模型输出进行预先审核、实时过滤或绝对控制。'
      },
      {
        label: '用户责任',
        body: '用户需对自己输入、创建、发布及向外传播的全部内容独立承担民事、行政乃至刑事责任。',
        tone: 'warn'
      },
      {
        label: '禁止内容',
        body: '严禁编辑、发送涉政不当言论、色情低俗、暴力血腥、造谣诽谤、侵犯他人肖像或文案权益、违禁违法等信息；由此产生的平台处罚或法律后果均由使用人自行承担。',
        tone: 'danger'
      }
    ],
    noticeTone: 'warn'
  },
  {
    title: 'AI 内容风险警示',
    summary: '本站展示的 AI 内容仅用于虚拟娱乐创作，具有随机性与虚构性，不具备现实真实性，也不构成任何专业意见。',
    markers: ['仅限虚拟娱乐', '不得替代专业判断', '继续使用视为同意规则'],
    clauses: [
      {
        label: '内容属性',
        body: 'AI 生成的剧情、文字与对话内容仅属于网络虚拟娱乐创作，不具备事实证明、现实判断或专业参考效力。'
      },
      {
        label: '风险自担',
        body: '任何用户若仅凭 AI 虚构内容作出法律、医疗、投资、财产或其他重大现实决策，由此产生的损失、纠纷和后果均由当事人自行承担。',
        tone: 'danger'
      },
      {
        label: '规则效力',
        body: '完成本流程并继续使用网站，即视为你已经完整阅读、充分理解并自愿接受本声明的全部条款及其后续在法律允许范围内的合理修订。'
      },
      {
        label: '冲突处理',
        body: '若本声明个别条款与现行有效法律法规存在冲突，以国家现行法律法规的强制性规定为优先执行标准。'
      }
    ],
    notice: '如你不能接受 AI 内容的随机性、虚构性与风险自担原则，请勿继续进入本站。',
    noticeTone: 'danger'
  },
];

const confirmChecklist = [
  {
    title: '确认年龄条件',
    body: '你需确认本人已满十八周岁，并具备独立承担民事法律后果的资格。'
  },
  {
    title: '确认阅读完成',
    body: '你需确认已完整阅读并理解前述全部条款，而非仅浏览标题或节选内容。'
  },
  {
    title: '确认责任归属',
    body: '你需确认理解用户输入内容、外部 AI 生成结果以及后续传播行为的责任边界。'
  }
] as const;

const totalSteps = steps.length + 2;
const readDelaySeconds = 8;
const activeStep = ref(0);
const typedConfirmation = ref('');
const remainingSeconds = ref(readDelaySeconds);
const socialTab = ref<'register' | 'login' | 'other'>('register');
const registerUsername = ref('');
const registerPassword = ref('');
const loginUsername = ref('');
const loginPassword = ref('');
const socialFeedback = ref('');
const socialFeedbackKind = ref<'neutral' | 'success' | 'warn' | 'error'>('neutral');
const prankRegisteredUsername = ref('');
const prankRegisteredPassword = ref('');
const prankPasswordResetDone = ref(false);
const githubLinkBusy = ref(false);
let githubLoginWindow: Window | null = null;

let countdownTimer: number | null = null;

const trackStyle = computed(() => ({
  transform: `translateX(-${activeStep.value * 100}%)`
}));
const stepNumber = computed(() => String(activeStep.value + 1).padStart(2, '0'));
const isConfirmationMatched = computed(() => typedConfirmation.value.trim() === confirmationText);
const showCountdown = computed(() => remainingSeconds.value > 0);
const isConfirmStep = computed(() => activeStep.value === steps.length);
const isSocialStep = computed(() => activeStep.value === steps.length + 1);
const canFinishSocialStep = computed(() => prankPasswordResetDone.value);
const socialStatusBadge = computed(() => {
  if (githubLinkBusy.value) return '处理中';
  if (prankPasswordResetDone.value) return '已通过';
  if (socialFeedbackKind.value === 'error') return '受限';
  return socialTab.value === 'other' ? '第三方' : '登录';
});
const socialStepFooterCopy = computed(() => {
  if (githubLinkBusy.value) return 'GitHub 登录处理中，返回后会自动恢复或绑定备份。';
  if (canFinishSocialStep.value) return '给你开后门，跳过登录直接进入网站';
  return '完成登录账号或第三方登录后，即可进入网站。';
});
const footerPrimaryLabel = computed(() => {
  if (isConfirmStep.value) return '进入登录系统';
  if (isSocialStep.value) return '确认进入网站';
  return nextButtonLabel.value;
});
const isNextDisabled = computed(() => {
  if (remainingSeconds.value > 0) return true;
  if (isSocialStep.value) return !canFinishSocialStep.value;
  if (isConfirmStep.value) return !isConfirmationMatched.value;
  return false;
});
const nextButtonLabel = computed(() => {
  if (remainingSeconds.value > 0) return `继续阅读 (${remainingSeconds.value}s)`;
  return activeStep.value === steps.length - 1 ? '进入最终确认' : '继续下一项';
});

function stopCountdown() {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function setSocialFeedback(message: string, kind: 'neutral' | 'success' | 'warn' | 'error' = 'neutral') {
  socialFeedback.value = message;
  socialFeedbackKind.value = kind;
}

function switchSocialTab(tab: 'register' | 'login' | 'other') {
  socialTab.value = tab;
  socialFeedback.value = '';
}

function triggerProviderReply(provider: 'wechat' | 'qq' | 'apple') {
  if (provider === 'wechat') {
    setSocialFeedback('微信登录暂时不可用', 'warn');
    return;
  }
  if (provider === 'qq') {
    setSocialFeedback('正在检测你是不是 2009 年的尊贵黄钻会员，请稍等...', 'warn');
    return;
  }
  setSocialFeedback('Apple 登录检测到你的设备暂不支持，请稍后重试', 'warn');
}

function submitRegister() {
  if (!registerUsername.value.trim()) {
    setSocialFeedback('请输入用户名后再继续。', 'error');
    return;
  }
  if (registerPassword.value.trim().length < 6) {
    setSocialFeedback('密码长度不能少于 6 位。', 'error');
    return;
  }

  prankRegisteredUsername.value = registerUsername.value.trim();
  prankRegisteredPassword.value = registerPassword.value;
  loginUsername.value = prankRegisteredUsername.value;
  loginPassword.value = prankRegisteredPassword.value;
  socialTab.value = 'login';
  setSocialFeedback(`账号 ${prankRegisteredUsername.value} 注册成功，请返回登录继续验证。`, 'success');
}

function submitLogin() {
  if (!prankRegisteredUsername.value) {
    setSocialFeedback('当前设备尚未创建账号，请先完成注册。', 'warn');
    socialTab.value = 'register';
    return;
  }
  if (loginUsername.value.trim() !== prankRegisteredUsername.value) {
    setSocialFeedback('账号不存在，请检查用户名后重试。', 'error');
    return;
  }
  if (loginPassword.value !== prankRegisteredPassword.value) {
    setSocialFeedback('密码错误，请重新输入。', 'error');
    return;
  }

  setSocialFeedback('该用户已被封禁，请使用第三方登录或点击“联系LINK客服反馈”按钮。', 'error');
}

function isGitHubOAuthMessage(value: unknown): value is GitHubOAuthMessage {
  return Boolean(value && typeof value === 'object' && (value as { type?: string }).type === 'link:github-oauth');
}

async function bindGitHubBackupAccount(token: string, owner: string, repo?: string, branch?: string) {
  if (!store.settings) throw new Error('设置尚未载入。');

  const repository = await ensureGitHubBackupRepository({
    token,
    owner,
    repo: repo?.trim() || store.settings.githubBackup.repo || 'link-private-backups'
  });
  await store.saveSettings({
    ...store.settings,
    githubBackup: {
      ...store.settings.githubBackup,
      token,
      owner: repository.owner,
      repo: repository.repo,
      branch: branch?.trim() || repository.branch || 'main',
      enabled: true,
      lastBackupStatus: 'idle',
      lastBackupError: ''
    }
  });
  return repository;
}

function openGitHubSocialLogin() {
  const login = buildGitHubLoginUrl();
  githubLoginWindow = window.open(login.url, 'link-github-oauth', 'width=480,height=720');
  githubLinkBusy.value = true;
  setSocialFeedback(login.mode === 'worker'
    ? '已打开 GitHub 授权页，授权完成后将自动检查并同步云端备份。'
    : login.mode === 'oauth'
      ? '已打开 GitHub 授权页，正在等待回调完成身份验证。'
      : '已打开 GitHub token 页面。若当前环境暂不支持自动回调，可返回设置页手动绑定。');
}

async function handleGitHubOAuthMessage(event: MessageEvent) {
  const workerOrigin = getGitHubOAuthWorkerOrigin();
  if (!workerOrigin || event.origin !== workerOrigin) return;
  if (!isGitHubOAuthMessage(event.data)) return;

  githubLinkBusy.value = false;
  const message = event.data;
  if (message.error) {
    setSocialFeedback(message.error, 'error');
    return;
  }
  if (!message.token || !message.owner) {
    setSocialFeedback('GitHub 登录结果不完整，请重试。', 'error');
    return;
  }

  try {
    const repository = await bindGitHubBackupAccount(message.token, message.owner, message.repo, message.branch);
    const hasRemoteBackup = await store.hasGitHubBackup();
    githubLoginWindow?.close();
    if (hasRemoteBackup) {
      const latestRemote = store.settings?.githubBackup;
      if (latestRemote?.latestRemoteBackupSha) {
        await store.saveSettings({
          ...store.settings!,
          githubBackup: {
            ...store.settings!.githubBackup,
            pendingRestoreSha: latestRemote.latestRemoteBackupSha,
            pendingRestoreAt: latestRemote.latestRemoteBackupAt
          }
        });
        await store.importGitHubBackup(latestRemote.latestRemoteBackupSha);
      }
      prankPasswordResetDone.value = true;
      setSocialFeedback(`GitHub 登录成功，已从 ${repository.owner}/${repository.repo} 导入备份并允许进入。`, 'success');
      return;
    }

    prankPasswordResetDone.value = true;
    setSocialFeedback(`GitHub 登录成功，当前未检测到远端备份，已绑定 ${repository.owner}/${repository.repo} 作为自动备份账号。`, 'success');
  } catch (error) {
    setSocialFeedback(error instanceof Error ? error.message : 'GitHub 登录后绑定失败。', 'error');
  }
}

function startCountdown() {
  stopCountdown();
  remainingSeconds.value = readDelaySeconds;
  countdownTimer = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      remainingSeconds.value = 0;
      stopCountdown();
      return;
    }
    remainingSeconds.value -= 1;
  }, 1000);
}

function goPrev() {
  if (activeStep.value === 0) return;
  activeStep.value -= 1;
}

function contactLinkSupport() {
  prankPasswordResetDone.value = true;
  setSocialFeedback('已转交 LINK 客服处理，你现在可以直接进入网站。', 'success');
}

function handleNext() {
  if (isNextDisabled.value) return;

  if (isSocialStep.value) {
    stopCountdown();
    emit('complete');
    return;
  }

  if (isConfirmStep.value) {
    stopCountdown();
    activeStep.value += 1;
    return;
  }

  activeStep.value += 1;
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      stopCountdown();
      return;
    }

    activeStep.value = 0;
    typedConfirmation.value = '';
    startCountdown();
  },
  { immediate: true }
);

watch(activeStep, () => {
  if (!props.modelValue) return;
  startCountdown();
});

const githubOAuthMessageListener = (event: MessageEvent) => {
  void handleGitHubOAuthMessage(event);
};

onMounted(() => {
  window.addEventListener('message', githubOAuthMessageListener);
});

onBeforeUnmount(() => {
  stopCountdown();
  window.removeEventListener('message', githubOAuthMessageListener);
});
</script>

<style scoped>
.disclaimer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  min-height: var(--app-height);
  padding: calc(14px + var(--safe-top)) calc(14px + var(--safe-right)) calc(14px + var(--safe-bottom)) calc(14px + var(--safe-left));
  background:
    radial-gradient(circle at top, rgba(8, 182, 104, 0.1), transparent 34%),
    radial-gradient(circle at bottom left, rgba(0, 0, 0, 0.18), transparent 36%),
    rgba(14, 20, 18, 0.52);
  backdrop-filter: blur(18px);
}

.disclaimer-panel {
  --accent: #08b668;
  --accent-ink: #0a7042;
  --accent-soft: rgba(8, 182, 104, 0.1);
  --warn-soft: rgba(240, 171, 67, 0.14);
  --warn-ink: #9c6120;
  --danger-soft: rgba(228, 87, 87, 0.12);
  --danger-ink: #a23c3c;
  --panel-border: rgba(14, 28, 21, 0.08);
  width: min(100%, 416px);
  height: min(calc(var(--app-height) - 28px), 720px);
  max-height: min(calc(var(--app-height) - 28px), 720px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 248, 0.98));
  box-shadow: 0 28px 80px rgba(5, 16, 11, 0.22);
  overflow: hidden;
}

.disclaimer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.disclaimer-title-group {
  min-width: 0;
}

.disclaimer-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(10, 112, 66, 0.1);
  color: var(--accent-ink);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.header-badge-soft {
  background: rgba(15, 23, 42, 0.06);
  color: #425466;
}

.disclaimer-kicker {
  margin: 0 0 5px;
  color: #627169;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.disclaimer-header h1 {
  margin: 0;
  color: #17211b;
  font-size: 24px;
  line-height: 1.08;
  font-weight: 900;
}

.disclaimer-progress-card {
  flex: 0 0 auto;
  display: grid;
  gap: 2px;
  min-width: 66px;
  padding: 8px 10px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(8, 182, 104, 0.12), rgba(8, 182, 104, 0.04));
  color: var(--accent-ink);
  text-align: right;
}

.disclaimer-progress-card span,
.disclaimer-progress-card small {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.disclaimer-progress-card strong {
  font-size: 18px;
  line-height: 1;
}

.disclaimer-track-shell {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.disclaimer-track {
  display: flex;
  height: 100%;
  min-height: 0;
  transition: transform 320ms ease;
}

.disclaimer-step {
  flex: 0 0 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding: 4px 1px 3px;
  -webkit-overflow-scrolling: touch;
}

.disclaimer-step::-webkit-scrollbar {
  width: 6px;
}

.disclaimer-step::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(23, 33, 27, 0.14);
}

.step-head {
  display: grid;
  gap: 9px;
}

.disclaimer-step h2 {
  margin: 0;
  color: #18211c;
  font-size: 18px;
  line-height: 1.24;
}

.step-summary {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(8, 182, 104, 0.12);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(8, 182, 104, 0.09), rgba(255, 255, 255, 0.9));
  color: #304239;
  font-size: 12px;
  line-height: 1.62;
}

.step-markers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.step-marker {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #31413a;
  font-size: 10px;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: rgba(8, 182, 104, 0.5);
  text-underline-offset: 4px;
}

.clause-list {
  display: grid;
  gap: 9px;
  margin-top: 12px;
}

.clause-card {
  padding: 11px 12px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.clause-card.tone-warn {
  border-color: rgba(240, 171, 67, 0.28);
  background: linear-gradient(180deg, rgba(240, 171, 67, 0.08), rgba(255, 255, 255, 0.96));
}

.clause-card.tone-danger {
  border-color: rgba(228, 87, 87, 0.24);
  background: linear-gradient(180deg, rgba(228, 87, 87, 0.08), rgba(255, 255, 255, 0.96));
}

.clause-label {
  margin: 0 0 6px;
  color: #17211b;
  font-size: 12px;
  font-weight: 800;
  text-decoration: underline;
  text-decoration-color: rgba(8, 182, 104, 0.72);
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}

.clause-card.tone-warn .clause-label {
  text-decoration-color: rgba(240, 171, 67, 0.74);
}

.clause-card.tone-danger .clause-label {
  text-decoration-color: rgba(228, 87, 87, 0.8);
}

.clause-body {
  margin: 0;
  color: #56645d;
  font-size: 12px;
  line-height: 1.66;
}

.step-notice {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.05);
}

.step-notice.tone-neutral {
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.step-notice.tone-warn {
  border: 1px solid rgba(240, 171, 67, 0.26);
  background: var(--warn-soft);
}

.step-notice.tone-danger {
  border: 1px solid rgba(228, 87, 87, 0.24);
  background: var(--danger-soft);
}

.notice-title {
  color: #17211b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.step-notice p {
  margin: 0;
  color: #49564f;
  font-size: 12px;
  line-height: 1.6;
}

.disclaimer-step-confirm {
  display: flex;
  flex-direction: column;
}

.confirm-checklist {
  display: grid;
  gap: 9px;
  margin-top: 10px;
}

.confirm-note-card {
  padding: 11px 12px;
  border: 1px solid rgba(8, 182, 104, 0.16);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(8, 182, 104, 0.08), rgba(255, 255, 255, 0.98));
}

.confirm-note-title {
  margin: 0 0 5px;
  color: #17211b;
  font-size: 12px;
  font-weight: 800;
  text-decoration: underline;
  text-decoration-color: rgba(8, 182, 104, 0.7);
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}

.confirm-note-body {
  margin: 0;
  color: #526059;
  font-size: 12px;
  line-height: 1.6;
}

.confirm-quote {
  margin-top: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(246, 249, 247, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.quote-label {
  margin: 0 0 7px;
  color: #526059;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.quote-text {
  margin: 0;
  color: #18211c;
  font-size: 12px;
  line-height: 1.66;
}

.confirm-field {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.confirm-field span {
  color: #526059;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.confirm-field textarea {
  min-height: 112px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  color: #17211b;
  font-size: 12px;
  line-height: 1.6;
  resize: none;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.confirm-field textarea:focus {
  border-color: rgba(8, 182, 104, 0.48);
  box-shadow: 0 0 0 4px rgba(8, 182, 104, 0.1);
}

:global(html.is-ios) .confirm-field textarea {
  font-size: var(--ios-control-font-size) !important;
  line-height: 1.5;
}

.confirm-hint {
  margin-top: 7px;
  font-size: 11px;
  line-height: 1.45;
}

.confirm-hint-error {
  color: var(--danger-ink);
}

.confirm-hint-success {
  color: var(--accent-ink);
}

.disclaimer-step-social {
  display: flex;
  flex-direction: column;
}

.social-shell {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.social-shell-header,
.auth-tab-row,
.gender-chip-row,
.social-status-pill,
.oauth-button,
.history-entry,
.social-provider-divider,
.social-provider-grid,
.provider-chip,
.auth-inline-actions {
  display: flex;
  align-items: center;
}

.social-shell-realistic {
  gap: 14px;
  padding: 18px 16px 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 251, 251, 0.98));
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.08);
}

.social-app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.social-header-support {
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #535963;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.social-brand-card {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 6px 0 2px;
  text-align: center;
}

.social-brand-avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: linear-gradient(180deg, #d9dadf, #c6c8cf);
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.7);
}

.social-brand-card strong {
  color: #2a2d33;
  font-size: 19px;
  font-weight: 800;
}

.social-brand-card p,
.auth-card-copy,
.reset-card p,
.social-feedback {
  margin: 0;
  color: #8f949b;
  font-size: 12px;
  line-height: 1.58;
}

.social-status-pill {
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.social-status-pill.tone-neutral {
  background: rgba(15, 23, 42, 0.06);
  color: #425466;
}

.social-status-pill.tone-success {
  background: rgba(8, 182, 104, 0.12);
  color: var(--accent-ink);
}

.social-status-pill.tone-warn {
  background: var(--warn-soft);
  color: var(--warn-ink);
}

.social-status-pill.tone-error {
  background: var(--danger-soft);
  color: var(--danger-ink);
}

.auth-tab-row {
  gap: 8px;
  padding: 4px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
}

.auth-tab {
  flex: 1;
  min-height: 34px;
  border-radius: 12px;
  background: transparent;
  color: #7b8289;
  font-size: 12px;
  font-weight: 800;
}

.auth-tab.active {
  background: #ffffff;
  color: #24272d;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.auth-card,
.reset-card,
.social-log-card {
  display: grid;
  gap: 12px;
  padding: 4px 0 0;
  border-radius: 0;
  border: 0;
  background: #ffffff;
  box-shadow: none;
}

.auth-card-title {
  margin: 0;
  color: #2a2d33;
  font-size: 24px;
  font-weight: 800;
}

.auth-card-realistic {
  gap: 14px;
}

.auth-field {
  display: grid;
  gap: 6px;
}

.auth-field span,
.social-log-title,
.reset-card strong {
  color: #575e65;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.auth-field input {
  min-height: 48px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 0;
  background: transparent;
  color: #1d2127;
  font-size: 14px;
}

.auth-field input:focus {
  border-color: rgba(48, 53, 63, 0.48);
  box-shadow: inset 0 -1px 0 rgba(48, 53, 63, 0.48);
}

.auth-inline-actions {
  justify-content: space-between;
  gap: 8px;
}

.auth-link-button,
.auth-inline-note {
  color: #8a8f96;
  font-size: 12px;
}

.auth-link-button {
  padding: 0;
  font-weight: 600;
}

.gender-chip-row {
  flex-wrap: wrap;
  gap: 8px;
}

.gender-chip {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #4d5560;
  font-size: 12px;
  font-weight: 700;
}

.gender-chip.locked {
  background: rgba(228, 87, 87, 0.08);
  color: var(--danger-ink);
}

.gender-chip.active {
  background: rgba(43, 48, 58, 0.9);
  color: #ffffff;
}

.social-primary-button,
.social-secondary-button {
  min-height: 46px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
}

.social-primary-button {
  background: linear-gradient(180deg, #4b4b4f, #343438);
  color: #ffffff;
}

.social-primary-button-dark {
  box-shadow: 0 12px 24px rgba(31, 33, 39, 0.16);
}

.social-secondary-button {
  background: rgba(15, 23, 42, 0.06);
  color: #18211c;
}

.oauth-button {
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 18px;
  text-align: left;
}

.oauth-button span,
.oauth-button small {
  display: block;
}

.oauth-button span {
  font-size: 12px;
  font-weight: 800;
}

.oauth-button small {
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
}

.oauth-button.github {
  background: linear-gradient(180deg, #161b22, #0d1117);
  color: #ffffff;
}

.oauth-button-primary {
  box-shadow: 0 16px 28px rgba(9, 13, 18, 0.18);
}

.oauth-button.muted {
  background: rgba(15, 23, 42, 0.06);
  color: #31413a;
}

.oauth-button.muted small {
  color: #6b7b73;
}

.oauth-button:disabled {
  opacity: 0.72;
}

.social-provider-divider {
  justify-content: center;
  gap: 12px;
  color: #9ca2a8;
  font-size: 11px;
  font-weight: 700;
}

.social-provider-divider span {
  flex: 1;
  height: 1px;
  background: rgba(15, 23, 42, 0.1);
}

.social-provider-grid {
  justify-content: center;
  gap: 12px;
}

.provider-chip {
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 82px;
  min-height: 82px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.04);
  color: #49515a;
}

.provider-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #ffffff;
  color: #2d3138;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.provider-chip small {
  font-size: 11px;
  color: #707780;
}

.other-login-note {
  margin: 0;
  color: #959ba2;
  font-size: 11px;
  line-height: 1.6;
}

.social-feedback.tone-success {
  color: var(--accent-ink);
}

.social-feedback.tone-warn {
  color: var(--warn-ink);
}

.social-feedback.tone-error {
  color: var(--danger-ink);
}

.social-feedback-banner {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
}

.social-feedback-banner.tone-success {
  background: rgba(8, 182, 104, 0.1);
}

.social-feedback-banner.tone-warn {
  background: rgba(240, 171, 67, 0.12);
}

.social-feedback-banner.tone-error {
  background: rgba(228, 87, 87, 0.1);
}

.disclaimer-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(23, 33, 27, 0.18);
  transition: transform 200ms ease, background 200ms ease, width 200ms ease;
}

.dot.active {
  width: 16px;
  transform: none;
  background: var(--accent);
}

.disclaimer-footer {
  display: grid;
  gap: 9px;
}

.countdown-copy {
  min-height: 17px;
  color: #63726a;
  font-size: 11px;
  font-weight: 700;
}

.countdown-copy.ready {
  color: var(--accent-ink);
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.disclaimer-button {
  flex: 1;
  min-height: 40px;
  border-radius: 12px;
  font-size: 12px;
}

.disclaimer-button-primary {
  background: linear-gradient(180deg, #12c974, #08b668);
  box-shadow: 0 16px 30px rgba(8, 182, 104, 0.28);
}

.disclaimer-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

@media (max-width: 420px) {
  .disclaimer-backdrop {
    padding: 0;
  }

  .disclaimer-panel {
    width: 100%;
    height: var(--app-height);
    max-height: var(--app-height);
    border-radius: 0;
    padding-top: calc(14px + var(--safe-top));
    padding-right: calc(14px + var(--safe-right));
    padding-bottom: calc(14px + var(--safe-bottom));
    padding-left: calc(14px + var(--safe-left));
  }

  .disclaimer-header {
    gap: 9px;
  }

  .disclaimer-header h1 {
    font-size: 22px;
  }

  .disclaimer-progress-card {
    min-width: 62px;
    padding: 8px;
  }
}
</style>