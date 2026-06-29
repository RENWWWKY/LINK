import type { SmallTheaterTopic } from '@/types/domain';
import { createId } from './id';

export const defaultSmallTheaterTopicDrafts: Array<Pick<SmallTheaterTopic, 'title' | 'prompt'>> = [
  {
    title: '根据剧情随机发挥',
    prompt: '从当前剧情、关系张力、近期对话和角色生活状态中随机发挥脑洞做成独立番外小剧场。'
  },
  {
    title: '论坛',
    prompt: '做成匿名论坛或贴吧式讨论串，围绕角色近期事件、传闻或生活片段展开，有楼层、回复、投票或折叠互动。'
  },
  {
    title: '知乎',
    prompt: '做成知乎问答页面，问题与角色近期经历相关，回答者可以是角色社交圈 NPC 或匿名用户，带赞同、评论、展开回答等互动。'
  },
  {
    title: '角色所在群聊',
    prompt: '做成角色所在群聊的番外页面，群成员只能来自该角色自己的社交圈，围绕一个小事件聊天、起哄、转移话题。'
  },
  {
    title: '番外篇角色身边发生的几个小故事',
    prompt: '做成几个短篇卡片或时间线，展示角色身边正在发生但不会进入正文会话的生活小故事。'
  },
  {
    title: '番外篇角色社交圈 NPC 和角色发生的几个小故事',
    prompt: '做成多段 NPC 视角的小故事，NPC 只能来自当前角色设定、世界书、记忆或当前上下文，不要借用其他角色社交圈。'
  },
  {
    title: '深夜电台来信',
    prompt: '做成深夜电台、匿名投稿或语音来信页面，用几封来信和主持回应折射角色近期情绪与人际关系。'
  },
  {
    title: '角色手机相册翻页',
    prompt: '做成手机相册或截图集，用户可以点击照片、便签、聊天截图或地点标签，拼出角色当天发生的小事。'
  },
  {
    title: '平行世界一日',
    prompt: '做成轻微 if 线番外，在不改变正文事实的前提下展示一个平行世界小切片，并明确它只是番外想象。'
  },
  {
    title: '校园或职场传闻板',
    prompt: '做成校园墙、公司茶水间、社团公告板或小道消息页面，围绕角色出现的细节、误会和旁观者反应展开。'
  },
  {
    title: '失物招领与小道消息',
    prompt: '做成失物招领、便利贴墙或公告栏互动页面，通过物品线索、留言和小传闻串起角色的生活片段。'
  },
  {
    title: '互动小游戏番外',
    prompt: '做成轻量互动小游戏或可点选分支页面，例如抽签、翻牌、解谜、消息回复选择，但内容仍围绕角色番外。'
  }
];

export function createDefaultSmallTheaterTopics(charId: string, timestamp = Date.now()): SmallTheaterTopic[] {
  return defaultSmallTheaterTopicDrafts.map((draft, index) => ({
    id: createId('theater-topic'),
    charId,
    title: draft.title,
    prompt: draft.prompt,
    enabled: true,
    builtIn: true,
    createdAt: timestamp + index,
    updatedAt: timestamp + index
  }));
}

export function normalizeSmallTheaterTopic(topic: Partial<SmallTheaterTopic> | null | undefined, fallbackCharId = ''): SmallTheaterTopic | null {
  const charId = String(topic?.charId ?? fallbackCharId).trim();
  const title = String(topic?.title ?? '').trim();
  if (!charId || !title) return null;
  const now = Date.now();
  return {
    id: String(topic?.id ?? '').trim() || createId('theater-topic'),
    charId,
    title,
    prompt: String(topic?.prompt ?? '').trim(),
    enabled: topic?.enabled !== false,
    builtIn: Boolean(topic?.builtIn),
    createdAt: Math.max(0, Number(topic?.createdAt ?? now) || now),
    updatedAt: Math.max(0, Number(topic?.updatedAt ?? now) || now)
  };
}
