import { lazy } from "react";
import type { Lang } from "../content";
import type { Tx } from "./i18n";

/**
 * The notebook's contents.
 *
 * Every topic is code-split. The reader who lands on the profile should not
 * download a sorting visualisation to get there — the notes are the heaviest
 * side by far, and the other two must not pay for it. The rail below is plain
 * data, so it renders without loading a single topic.
 *
 * `no` is a page reference, not a difficulty or an order you must follow. The
 * sheet metaphor holds: this is a notebook with numbered pages, and you open
 * the one you need.
 */

/**
 * Grown one page at a time. A topic appears in this list only when its page
 * exists — an entry pointing at a stub would put an empty page behind a link
 * that promises content, which is worse than a shorter contents list.
 */
export type TopicId =
  | "system"
  | "jvm"
  | "javacore"
  | "oop"
  | "collections"
  | "dsa"
  | "concurrency"
  | "servlet"
  | "spring"
  | "jpa"
  | "database"
  | "security"
  | "testing"
  | "devops";

export type Topic = {
  id: TopicId;
  no: string;
  /** Rail label. Short — it has to fit a column on a phone. */
  name: Tx;
  /** One line, shown on the contents page. */
  blurb: Tx;
  /**
   * Every page takes `lang` even when it ignores it. The theory pages are
   * Vietnamese-only by design (see design.md), but reading the language off
   * `document.documentElement` instead of taking it as a prop is the kind of
   * hidden coupling that breaks the first time a page is rendered in a test.
   */
  Page: React.LazyExoticComponent<(p: { lang: Lang }) => React.JSX.Element>;
};

export const TOPICS: Topic[] = [
  {
    id: "system",
    no: "00",
    name: { vi: "Hệ thống của tôi", en: "The system I run" },
    blurb: { vi: "Sáu cơ chế trong backend IntelliPath, mỗi cái một bản vẽ và một chỗ nó chưa làm được.", en: "Six mechanisms from the IntelliPath backend, each with a drawing and a line naming what it does not do." },
    Page: lazy(() => import("./topics/System")),
  },
  {
    id: "jvm",
    no: "01",
    name: { vi: "JVM & bộ nhớ", en: "JVM & memory" },
    blurb: { vi: "Bytecode và JIT, stack so với heap, và garbage collector dọn theo thế hệ.", en: "Bytecode and the JIT, stack against heap, and a generational garbage collector." },
    Page: lazy(() => import("./topics/Jvm")),
  },
  {
    id: "javacore",
    no: "02",
    name: { vi: "Java core", en: "Java core" },
    blurb: { vi: "Truyền tham số, exception, generic, stream, equals — chín quy tắc không nhìn thấy được khi đọc code.", en: "Argument passing, exceptions, generics, streams, equals — nine rules that are invisible in the source." },
    Page: lazy(() => import("./topics/JavaCore")),
  },
  {
    id: "oop",
    no: "03",
    name: { vi: "OOP & SOLID", en: "OOP & SOLID" },
    blurb: { vi: "Bốn tính chất, method nào thật sự chạy, và năm nguyên tắc kèm ví dụ.", en: "The four properties, which method actually runs, and five principles with worked examples." },
    Page: lazy(() => import("./topics/Oop")),
  },
  {
    id: "collections",
    no: "04",
    name: { vi: "Collections", en: "Collections" },
    blurb: { vi: "HashMap.put() từng bước, và vì sao dung lượng luôn là luỹ thừa của hai.", en: "HashMap.put() step by step, and why capacity is always a power of two." },
    Page: lazy(() => import("./topics/Collections")),
  },
  {
    id: "dsa",
    no: "05",
    name: { vi: "Cấu trúc & giải thuật", en: "Data structures & algorithms" },
    blurb: { vi: "Độ phức tạp, hai con trỏ, tìm nhị phân, tập hợp, danh sách liên kết — chạy từng bước.", en: "Complexity, two pointers, binary search, sets, linked lists — every one stepped through." },
    Page: lazy(() => import("./topics/Dsa")),
  },
  {
    id: "concurrency",
    no: "06",
    name: { vi: "Đa luồng", en: "Concurrency" },
    blurb: { vi: "volatile, synchronized, và lỗi mà khoá kiểm tra hai lần ngăn lại.", en: "volatile, synchronized, and the bug double-checked locking prevents." },
    Page: lazy(() => import("./topics/Concurrency")),
  },
  {
    id: "servlet",
    no: "07",
    name: { vi: "Servlet & JSP", en: "Servlet & JSP" },
    blurb: { vi: "Một người trực nhiều khách, forward so với redirect, chuỗi filter, và JSP thật ra là gì.", en: "One instance many threads, forward against redirect, the filter chain, and what a JSP really is." },
    Page: lazy(() => import("./topics/Servlet")),
  },
  {
    id: "spring",
    no: "08",
    name: { vi: "Spring", en: "Spring" },
    blurb: { vi: "IoC, proxy, và vì sao @Transactional im lặng không chạy khi gọi trong cùng class.", en: "IoC, proxies, and why @Transactional silently does nothing on a call from inside the same class." },
    Page: lazy(() => import("./topics/Spring")),
  },
  {
    id: "jpa",
    no: "09",
    name: { vi: "JPA & Hibernate", en: "JPA & Hibernate" },
    blurb: { vi: "Bốn trạng thái entity, dirty checking, và N+1 mà máy dev không cho bạn thấy.", en: "Four entity states, dirty checking, and the N+1 your dev machine will never show you." },
    Page: lazy(() => import("./topics/Jpa")),
  },
  {
    id: "database",
    no: "10",
    name: { vi: "PostgreSQL & SQL", en: "PostgreSQL & SQL" },
    blurb: { vi: "Index B-tree từng bước, JOIN, mức cô lập, MVCC, và pgvector.", en: "A B-tree index stepped through, JOINs, isolation levels, MVCC, and pgvector." },
    Page: lazy(() => import("./topics/Database")),
  },
  {
    id: "security",
    no: "11",
    name: { vi: "Bảo mật", en: "Security" },
    blurb: { vi: "JWT được ký chứ không được mã hoá, session so với token, băm so với mã hoá.", en: "JWT is signed, not encrypted; session against token; hashing against encryption." },
    Page: lazy(() => import("./topics/Security")),
  },
  {
    id: "testing",
    no: "12",
    name: { vi: "Kiểm thử", en: "Testing" },
    blurb: { vi: "Kim tự tháp test, Mockito, và chỗ 330 test của tôi còn thiếu.", en: "The test pyramid, Mockito, and the gap my 330 tests still leave." },
    Page: lazy(() => import("./topics/Testing")),
  },
  {
    id: "devops",
    no: "13",
    name: { vi: "Docker, Git, Maven", en: "Docker, Git, Maven" },
    blurb: { vi: "Lớp cache của Docker, multi-stage build, merge so với rebase, vòng đời Maven.", en: "Docker's layer cache, multi-stage builds, merge against rebase, the Maven lifecycle." },
    Page: lazy(() => import("./topics/DevOps")),
  },
];

export const DEFAULT_TOPIC: TopicId = "system";

export function resolveTopic(id: string | null): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}
