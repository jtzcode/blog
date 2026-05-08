---
title: AI Agent 的记忆如何构建
description: 思考碎片 20260424
pubDatetime: 2026-04-24T00:00:01Z
tags:
  - AI
  - Agent
  - Memory
lang: zh
featured: false
draft: true
---

# AI Agent 记忆如何构建

最近对 Agent 的记忆系统设计很感兴趣，尤其是结合人类的记忆机制，比较它们之间的异同，很有意思。这篇为相关思考和收获。

## 记忆是动态过程

首先，一个重要的问题是，我们**如何看待人类的记忆**。这不仅决定了我们如何认识自己，也能影响我们设计 agent 记忆系统的思路。

说起记忆，我们容易想到“存储“的概念。好像有了可靠的存储机制，就能解决一切记忆问题，可这是一个误解。

事实上，人类的记忆并不是静态的存储，记忆的提取也不是简单的检索和回放。

> 现代认知神经科学并不把记忆视为对过去经验的固定读取，而更倾向于将回忆理解为一种**线索驱动的动态重建**过程。过去经历会留下分布式的记忆痕迹（Engram）；当情境、内部状态、语义关联或目标与这些痕迹形成足够匹配时，相关神经活动模式被重新激活，并与既有知识和图式（Schema）重新组合，**生成**当下这一次回忆。因此，记忆既不是纯粹复现，也不是任意虚构，而是**在历史痕迹约束下的重构**。[^1] [^2] [^3] [^4]

从中可以提炼记忆机制的关键步骤：

- 过去经历留下记忆痕迹
- 当前线索与记忆痕迹匹配
- 相关神经活动模式被重新激活
- 与既有知识和图式重新组合
- 生成当下这一次回忆


下面我们就看看，在 Agent 记忆系统设计上有哪些尝试，是否在某些方面可以借鉴人类的记忆机制。

## 理解 Agent 记忆

大模型是 Agent 的“大脑“，Agent 的记忆机制会围绕大模型的特点来设计。从技术实现的角度看，我认为大模型的记忆可以区分为三个层面：

1. **参数记忆**：记忆可以写进权重参数，这是模型“真正地“记住了。

2. **上下文/KV 记忆**：记忆体现在推理过程内部，如长上下文、KV Cache 等。

3. **外部记忆**：记忆在模型外部，如向量库、知识图谱和数据库等。

对于第一种，权重参数在预训练阶段已经决定，让记忆体现于参数上很难。因为，Agent 的维护者大多没有资源频繁对模型重新训练和微调。即使不考虑时效性，微调也要考虑模型是否丢失已有的能力。

在这一点上，人类的**海马体**和**新皮层**系统就很高级。新皮层可以在睡眠时对海马体中的新记忆进行反复重放和巩固，优化新皮层中的神经连接，把新记忆转为长期记忆[^5] [^6]。这相当于对**神经网络的权重参数**进行调整，以体现新的记忆。

第三种就是我们常见的、基于存储和检索的记忆方案。这是静态的思路。

对于第二种，一个典型案例是 EverMind 公司提出的 **MSA** （Memory Sparse Attention）架构[^7]。

MSA 的思想是，让长期记忆以**潜在状态**（Latent States）的形式进入模型的注意力计算（Attention Computation），从而更深地融入推理过程。

它不是像 RAG 一样，简单地将检索到的文本重新插入提示词（Prompt），而是预先将历史内容编码为**潜在记忆状态**（Latent Memory States），并在推理时通过路由机制（Routing）和 Top-k 选择（Top-k Selection）从大量记忆块（Memory Blocks）中**筛选相关部分**，使这些记忆状态直接参与多层注意力（Multi-layer Attention）。

其中，“**稀疏**”（Sparse）的特点体现在：当前查询（Query）并不会对全部长期记忆状态做完整注意力计算，而是只激活并关注 Top-k 相关记忆块，从而降低计算和显存开销。

正是由于这是一种稀疏访问机制（Sparse Access），模型并不会完整关注全部历史记忆状态。如果路由机制没有准确选中真正相关的记忆块，关键信息就可能无法进入后续注意力计算，从而造成信息遗漏或推理偏差。

从这个过程也可以看出，**记忆是生成式的**，不是静态的。MSA 的这个思路与人类记忆的生成机制有些类似了。

这里有一个对比图：

![RAG Architecture](../../images/rag-msa-human.png)

## 记忆的巩固

我们先从另一个角度看记忆的分类。这里有一张所谓的四层记忆图：

![Memory Types](../../images/agent-memory.png)

是不是很眼熟？很多讨论 Agent 记忆的文章都会引用这篇论文[^8]，将 Agent 记忆分为上述四层结构或者四种类型。

其实，那篇文章并不是这些术语的原创者，只是把这些术语从人类记忆研究（`Soar` 架构）借鉴过来，映射到 Agent 记忆的设计上（即 `CoALA` 框架）。并且，四种类型术语并不是一次性发明的，而是有研究的历史沿革的。

在那篇文章中，这个映射如下：

| Soar 原版 | CoALA 适配 |
| --- | --- |
| 工作记忆 = 当前感知+目标+中间结果 | 工作记忆 = 多次 LLM 调用持久的数据结构（prompt + 解析后的输出） |
| 程序记忆 = 产生式规则 | 程序记忆 = LLM 权重（隐式）+ agent源代码（显式） |
| 语义记忆 = 世界事实 | 语义记忆 = 可检索的知识库（可由 agent 自己写入） |
| 情节记忆 = 过去行为序列 | 情节记忆 = 训练样本/历史轨迹/过往经验 |

注意，它把**程序记忆**分成了两类：

- 隐式程序记忆 = LLM 权重中编码的"怎么做"
- 显式程序记忆 = agent 的源代码（prompt模板、工具调用代码、决策流程）

隐式记忆就类似我们前面说的“参数记忆“，是在学习和训练时获得的记忆。

Agent 的代码本身是一种显式记忆。因此，

> 修改 Agent 代码 = 修改程序记忆 = 一种高风险的学习

Agent 知道了新的做事方式，也可能忘记了已有的做事方式。

---
### <center>警惕“拿来主义“</center>


当一个系统涉及智能、记忆、学习等概念和功能时，我们喜欢借鉴人类认知科学的研究和理论，指导工程上的设计，这种做法是符合直觉的但也值得警惕。

因为**并不是所有对于人类来说精妙的设计，都可以直接应用到工程系统**。这会限制我们的思路，甚至误导我们的设计方向。

像 `CoALA` 框架这种借鉴，其实背后有两个前提：

1. **功能模块化假设**：不同类型的信息需要不同的存取机制。情节记忆需要按时间/相关性检索；语义记忆需要按语义检索；程序记忆需要被"执行"而不是被"读取"。这不是一个必然结论，而是从 `Soar` 继承来的架构选择。

2. **人类认知是好的参照物**：`CoALA` 以及其他类似框架没有论证**为什么 Agent 应该像人一样组织记忆**，而是把它当作一个合理的出发点直接采用。

再比如，所谓**情节记忆和语义记忆，二者的边界在工程中是模糊的**。

在人类认知中，这两者有清晰的神经基础上区分。例如，海马体损伤的人（如著名病例 H.M.）丧失了情节记忆，但可以保留语义记忆。他可以知道"巴黎是法国首都"（语义记忆），但完全不记得自己什么时候学到的这件事（情节记忆）。

而在 Agent 工程中，当 Agent 从一次失败的工具调用中总结出类似"这个 API 在参数 X 为空时会返回 400 错误"这类结论，这算情节记忆还是语义记忆？首先，它来自一次具体经历，有情节记忆特征；但它已经被抽象为一条事实，也符合语义记忆特征。

在工程上，你关心的是**下次遇到类似情况时能不能召回它**，这跟它被存储为哪种记忆没有必然联系。

实际系统的实现可能是：先存为情节记忆，保留完整轨迹，然后用 LLM 反思、沉淀生成语义记忆。但这个两步过程是手动设计的：什么时候触发反思、沉淀的粒度是什么、要不要保留原始情节，都是需要回答的问题。

（*这只是一个提醒。最近在看《智能简史》，愈发觉得人类智能设计的精妙，很难忍住不去借鉴一二。* 😄）

---

前面提到，记忆之间是需要转变的，比如从情节记忆到语义记忆。而记忆的转变，需要一个沉淀和巩固（`Consolidation`）的过程。这个过程不必每时每刻都发生，只需发生在特定的时间窗口。

巩固过程对人类的记忆也很关键。神经科学里通常区分突触巩固（`Synaptic Consolidation`）和系统巩固（`Systems Consolidation`）。前者更快，发生在学习后的数分钟到数小时尺度，让新形成的痕迹更稳定；后者更慢，涉及海马体与新皮层之间的长期重组[^6]。

直觉上，**睡眠**应该是记忆巩固过程的关键时段。2024 年 TMR 综述认为，睡眠支持新记忆的强化（`Strengthening`）和整合（`Integration`），睡眠中的记忆激活（`Memory Reactivation`）被认为涉及新信息的重处理（`Reprocessing`）和重新分布（`Redistribution`），并与已有记忆网络整合[^9]。

然而，近年的研究越来越强调**清醒休息**（`Wakeful Rest`）的重要性。2025 年的一项综述汇总了 37 项研究和 63 个实验发现，学习后的安静清醒休息能显著促进记忆巩固，而且效果在 7 天后仍可以观察到[^10]。

对于 Agent 来说，其实无所谓“清醒“还是“睡眠“，因为人类的大脑在两种生理状态下确实有区别，而 Agent 系统的则没有。一个近似的类比是，Agent 的睡眠相当于**系统空闲**，典型场景如用户暂停、任务空闲以及会话间隔。

因此，可以借鉴的思路是**区分不同的巩固任务类型**，不妨从以下几个角度入手：

- 轻量 vs 深度
- 局部 vs 全局
- 近期情节 vs 长期历史

适合在“睡眠“时巩固的记忆就是深度的、全局的、长期的记忆，相应的任务可以是：

- 整合语义记忆
- 发现重复模式
- 发现冲突模式
- 给候选记忆打分

人类记忆还有一个非常重要的机制：旧记忆被重新激活后，可能进入短暂可塑状态，然后被加强、削弱或更新。这个过程成为重新巩固（ `Reconsolidation`）。

这对 Agent 设计也很重要。很多 Agent 记忆系统只在写入时做了巩固，却忽略了记忆被激活时的更新。例如，在某条旧记忆被检索并用于回答后：

- 是否仍然正确
- 是否出现新证据
- 是否需要提高/降低置信度
- 是否需要合并或拆分

对于巩固的目标，2023 年 Nature Neuroscience 的一篇研究提出一个很有意思的观点：系统巩固的目标不只是“把记忆从海马体转移到新皮层”，而是服务于**泛化**（`Generalization`）。

如果环境中有很多不可预测噪声，过度巩固反而会让系统过拟合。这篇文章提出，应该优先巩固**有助于泛化的可预测关系**，而不是所有细节[^11]。

对 Agent 记忆设计的启示是：

避免巩固这类记忆：

- 临时任务细节
- 一次性的调试中间结果
- 没有证据支持的推断

优先巩固这类记忆：
- 用户明确偏好
- 多次重复出现的模式
- 被验证过的项目事实
- 可复用的 Troubleshooting 方法

![Consolidation](../../images/consolidation.png)

## 什么时候遗忘

我始终觉得**遗忘也是智能的一部分**。

一个永远不会遗忘的 Agent 会出现几个问题：

- 临时事实被当成长期事实
- 过期项目状态影响决策
- 低价值细节挤占检索空间
- 过去失败经验被过度泛化
- 记忆臃肿影响检索效率

Agent 的遗忘机制的出发点不应该是“删除”，而应该设计成“可访问性下降”。真正的删除应该只用于隐私、安全、用户要求、法律合规以及确认无价值的垃圾信息。

这点很像人类记忆。人类遗忘很多时候不是痕迹彻底消失，而是变得更难被线索激活。有些记忆只有在特定线索、情境或强化后才能再次被唤起。

近年的 Agent 记忆研究也在往这个方向走，比如 `Oblivion` 框架 [^12] 明确把遗忘定义为 `Accessibility Decay`，而不是 `Explicit Deletion`。设计遗忘机制时，记忆的写入和检索的过程同样重要。

`Oblivion` 框架把记忆的处理分成 Read Path 和 Write Path。简单来说，Read Path 判断对于一个查询，当前工作记忆是否够用，如果不够，就去检索长期记忆。Write Path 决定哪些记忆应该被强化，没有被强化的记忆，其可访问性随着时间推移会逐渐衰减。

![Oblivion](../../images/read-write-path.png)

这与我们阅读的经验很类似。在阅读一本书或文章时，如果出现一个之前理解过的概念，当前上下文没有，那么就会提取这个概念相关的理解记忆，这就是 Read Path 逻辑；如果这个概念反复出现，相关的理解记忆就会被强化，这就是 Write Path 逻辑。如果这个概念只出现过一次，你可能就忘了之前是如何理解它的。

从这个思路出发，遗忘可以大致分为四种类型：

| 类型                            | 含义               | 是否删除原始数据 |
| ----------------------------- | ---------------- | -------- |
| **Accessibility Decay**       | 记忆还在，但默认不容易被检索出来 | 否        |
| **Compression / Abstraction** | 细节被压缩，只保留高层语义或方法 | 原始数据可归档  |
| **Supersession**              | 旧事实被新事实替代，但历史仍保留 | 否        |
| **Hard Deletion**             | 彻底删除或不可恢复删除      | 是        |

遗忘和记忆本是一体两面的事情，可以对比前面四种记忆类型来思考四种遗忘类型：

![Forgetting](../../images/forgetting.png)

遗忘机制设计的可以参考这几个原则：

**原则一：默认先降权，不默认删除**

删除是不可逆操作，应该谨慎。大多数遗忘应该是 Accessibility Decay。

**原则二：不同记忆类型用不同衰减率**

比如，临时上下文快衰减，用户明确偏好慢衰减；工具验证过的事实慢衰减，未经验证的推断快衰减。

**原则三：记忆被使用后要重新评估**

调用一次记忆，不只是读取和检索，也应该触发重新巩固或强化，就像 `Oblivion` 框架的 Read/Write Path 一样。

**原则四：遗忘要有用户控制**

比如，用户可以明确要求：

- 忘掉这个事实
- 这个只在本项目有效
- 这不是我的长期偏好

总结：
![](../../images/human-agent-memory.png)

## 延伸阅读

### 1. Human Memory Foundations

---

### 2. Cognitive Architectures and Agent Memory Frameworks

#### MemGPT / Letta

- Packer, C., Wooders, S., Lin, K., Fang, V., Patil, S. G., Stoica, I., & Gonzalez, J. E. (2023). **MemGPT: Towards LLMs as Operating Systems**.  
  Introduces virtual context management and memory tiers inspired by operating systems.  
  Relevance: helps understand working memory vs archival memory, and why context must be managed rather than simply expanded.  
  Source: https://arxiv.org/abs/2310.08560

- Letta Documentation. **Memory Management / Core, Recall, and Archival Memory**.  
  Productized continuation of MemGPT-style memory management.  
  Relevance: useful for seeing how agent-controlled memory tools are exposed in practice.  
  Source: https://docs.letta.com/concepts/memory-management/

---

### 3. Long-Term Agent Memory Systems

#### Zep / Graphiti

- Rasmussen, P., Paliychuk, P., Beauvais, T., Ryan, J., & Chalef, D. (2025). **Zep: A Temporal Knowledge Graph Architecture for Agent Memory**.  
  Proposes a temporal knowledge graph architecture for long-term agent memory.  
  Relevance: especially important for semantic memory, source/time-aware facts, fact invalidation, and relationship evolution.  
  Source: https://arxiv.org/abs/2501.13956

#### A-MEM

- Xu, W., Liang, Z., Mei, K., Gao, H., Tan, J., & Zhang, Y. (2025). **A-MEM: Agentic Memory for LLM Agents**.  
  Proposes a dynamic, Zettelkasten-inspired memory network for LLM agents.  
  Relevance: closest to memory evolution, linking, and reconsolidation-like updating.  
  Source: https://arxiv.org/abs/2502.12110

#### MemoryOS

- Kang, J., et al. (2025). **Memory OS of AI Agent**.  
  Proposes a hierarchical memory operating system for personalized AI agents.  
  Relevance: useful for studying short-term, mid-term, and long-term memory update pipelines.  
  Source: https://aclanthology.org/2025.emnlp-main.1318/

#### LangMem / LangGraph Memory

- LangChain. (2025). **LangMem SDK for Agent Long-Term Memory**.  
  SDK for extracting, updating, and consolidating long-term agent memory.  
  Relevance: practical engineering reference for memory extraction, consolidation, and personalization.  
  Source: https://www.langchain.com/blog/langmem-sdk-launch

#### Mem0

- Mem0. **Universal / Self-Improving Memory Layer for LLM Applications**.  
  Product-oriented memory layer for persistent context and user personalization.  
  Relevance: useful for application-level memory APIs and personalization memory.  
  Source: https://docs.mem0.ai/platform/overview

#### MemPalace

- MemPalace. **Open-source AI Memory System / Memory Palace for Agents**.  
  Local-first memory system using memory-palace-inspired organization and MCP integration.  
  Relevance: useful for episodic archive, verbatim-first memory, and agent-accessible memory tooling.  
  Source: https://github.com/mempalace/mempalace

---

### 4. Memory as a System Resource

#### MemOS

- Li, Z., Song, S., Xi, C., et al. (2025). **MemOS: A Memory OS for AI System**.  
  Treats memory as a first-class system resource and unifies plaintext memory, activation-based memory, and parameter-level memory.  
  Relevance: probably the most complete conceptual direction for memory lifecycle, provenance, versioning, scheduling, and memory evolution.  
  Source: https://arxiv.org/abs/2507.03724

---

## 参考文献

[^1]: https://www.annualreviews.org/doi/pdf/10.1146/annurev.psych.49.1.289
[^2]: https://wixtedlab.ucsd.edu/publications/Psych%20218/Tulving_Thompson_1973.pdf
[^3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7577560
[^4]: https://www.nature.com/articles/s41562-023-01799-z
[^5]: Bennett, M. (2023). **A Brief History of Intelligence**. Dutton. (中文版：班尼特. 《智能简史》) 
[^6]: Chen, Y., Chen, R., Yi, S., et al. (2026). **MSA: Memory Sparse Attention for Efficient End-to-End Memory Model Scaling to 100M Tokens**. https://arxiv.org/abs/2603.23516
[^7]: https://www.sciencedirect.com/science/article/abs/pii/S0306452224002306
[^8]: Sumers, T. R., Yao, S., Narasimhan, K., & Griffiths, T. L. (2023/2024). **Cognitive Architectures for Language Agents**. https://arxiv.org/abs/2309.02427
[^9]: https://www.nature.com/articles/s41539-024-00244-8
[^10]: https://link.springer.com/article/10.3758/s13423-025-02665-x
[^11]: https://www.nature.com/articles/s41593-023-01382-9
[^12]: https://arxiv.org/abs/2604.00131
