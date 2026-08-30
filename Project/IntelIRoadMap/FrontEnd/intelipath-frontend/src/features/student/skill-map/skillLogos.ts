// Tech logos for the skill map, from devicon.
//
// Imported one by one on purpose. `import.meta.glob` over node_modules would pull
// devicon's ~2,000 icons into the graph to use forty of them; naming each file
// keeps the bundle to what is actually drawn.
//
// Every entry is a technology with a real mark. Concepts — Agile, Microservices,
// DevOps, Project Management, SQL as a skill rather than a product — deliberately
// have none, because inventing a logo for an idea is how you end up with forty
// interchangeable gradient hexagons. Those fall back to the initial-letter disc.

import amazonwebservices from 'devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg'
import android from 'devicon/icons/android/android-original.svg'
import angular from 'devicon/icons/angular/angular-original.svg'
import ansible from 'devicon/icons/ansible/ansible-original.svg'
import apple from 'devicon/icons/apple/apple-original.svg'
import azure from 'devicon/icons/azure/azure-original.svg'
import bootstrap from 'devicon/icons/bootstrap/bootstrap-original.svg'
import c from 'devicon/icons/c/c-original.svg'
import cplusplus from 'devicon/icons/cplusplus/cplusplus-original.svg'
import csharp from 'devicon/icons/csharp/csharp-original.svg'
import css3 from 'devicon/icons/css3/css3-original.svg'
import django from 'devicon/icons/django/django-plain.svg'
import docker from 'devicon/icons/docker/docker-original.svg'
// `-plain` rather than `-original` for these three. devicon's originals are
// illustration-grade: Tux alone is 194 kB, which was 61% of every logo on this
// chart combined, to be drawn at 24 px where the detail is invisible anyway.
// Measured swap: 194 kB → 2.8 kB, 21.6 kB → 7.7 kB, 14.2 kB → 1.4 kB. The cost is
// brand colour on three marks; the alternative was shipping a photorealistic
// penguin to render a blob.
import dotnet from 'devicon/icons/dot-net/dot-net-plain.svg'
import elasticsearch from 'devicon/icons/elasticsearch/elasticsearch-original.svg'
import express from 'devicon/icons/express/express-original.svg'
import figma from 'devicon/icons/figma/figma-original.svg'
import flutter from 'devicon/icons/flutter/flutter-original.svg'
import git from 'devicon/icons/git/git-original.svg'
import go from 'devicon/icons/go/go-original.svg'
import googlecloud from 'devicon/icons/googlecloud/googlecloud-original.svg'
import gradle from 'devicon/icons/gradle/gradle-original.svg'
import grafana from 'devicon/icons/grafana/grafana-original.svg'
import graphql from 'devicon/icons/graphql/graphql-plain.svg'
import html5 from 'devicon/icons/html5/html5-original.svg'
import javaLogo from 'devicon/icons/java/java-original.svg'
import javascript from 'devicon/icons/javascript/javascript-original.svg'
import jenkins from 'devicon/icons/jenkins/jenkins-original.svg'
import jest from 'devicon/icons/jest/jest-plain.svg'
import jira from 'devicon/icons/jira/jira-original.svg'
import junit from 'devicon/icons/junit/junit-original.svg'
import kotlin from 'devicon/icons/kotlin/kotlin-original.svg'
import kubernetes from 'devicon/icons/kubernetes/kubernetes-original.svg'
import linux from 'devicon/icons/linux/linux-plain.svg'
import maven from 'devicon/icons/maven/maven-plain.svg'
import mongodb from 'devicon/icons/mongodb/mongodb-original.svg'
import mssql from 'devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg'
import mysql from 'devicon/icons/mysql/mysql-original.svg'
import nextjs from 'devicon/icons/nextjs/nextjs-original.svg'
import nginx from 'devicon/icons/nginx/nginx-original.svg'
import nodejs from 'devicon/icons/nodejs/nodejs-original.svg'
import oracle from 'devicon/icons/oracle/oracle-original.svg'
import php from 'devicon/icons/php/php-original.svg'
import postgresql from 'devicon/icons/postgresql/postgresql-original.svg'
import python from 'devicon/icons/python/python-original.svg'
import rabbitmq from 'devicon/icons/rabbitmq/rabbitmq-original.svg'
import react from 'devicon/icons/react/react-original.svg'
import redis from 'devicon/icons/redis/redis-original.svg'
import ruby from 'devicon/icons/ruby/ruby-original.svg'
import rust from 'devicon/icons/rust/rust-original.svg'
import selenium from 'devicon/icons/selenium/selenium-original.svg'
import spring from 'devicon/icons/spring/spring-original.svg'
import sqlite from 'devicon/icons/sqlite/sqlite-original.svg'
import swift from 'devicon/icons/swift/swift-original.svg'
import tailwindcss from 'devicon/icons/tailwindcss/tailwindcss-original.svg'
import terraform from 'devicon/icons/terraform/terraform-original.svg'
import typescript from 'devicon/icons/typescript/typescript-original.svg'
import vuejs from 'devicon/icons/vuejs/vuejs-original.svg'

/**
 * Skill name as the catalog spells it → logo.
 *
 * Keys are matched after `normalizeSkillKey`, so `Node.js`, `NodeJS` and `node js`
 * all land on the same entry. Aliases are listed explicitly rather than guessed at,
 * because a near-miss here silently draws the wrong company's mark on a student's
 * profile — worse than drawing no mark at all.
 */
const LOGO_BY_SKILL: Record<string, string> = {
  // Languages
  java: javaLogo,
  python: python,
  javascript: javascript,
  typescript: typescript,
  php: php,
  ruby: ruby,
  go: go,
  golang: go,
  rust: rust,
  kotlin: kotlin,
  swift: swift,
  c: c,
  'c++': cplusplus,
  cpp: cplusplus,
  'c#': csharp,
  csharp: csharp,
  html5: html5,
  html: html5,
  css3: css3,
  css: css3,

  // Frontend
  react: react,
  reactjs: react,
  angular: angular,
  vue: vuejs,
  vuejs: vuejs,
  'next.js': nextjs,
  nextjs: nextjs,
  tailwindcss: tailwindcss,
  tailwind: tailwindcss,
  bootstrap: bootstrap,

  // Backend & runtime
  'node.js': nodejs,
  nodejs: nodejs,
  express: express,
  'express.js': express,
  spring: spring,
  'spring boot': spring,
  django: django,
  '.net': dotnet,
  dotnet: dotnet,
  graphql: graphql,

  // Data
  postgresql: postgresql,
  postgres: postgresql,
  mysql: mysql,
  mongodb: mongodb,
  redis: redis,
  sqlite: sqlite,
  oracle: oracle,
  'sql server': mssql,
  'microsoft sql server': mssql,
  elasticsearch: elasticsearch,
  rabbitmq: rabbitmq,

  // Platform & ops
  docker: docker,
  kubernetes: kubernetes,
  k8s: kubernetes,
  linux: linux,
  git: git,
  nginx: nginx,
  jenkins: jenkins,
  terraform: terraform,
  ansible: ansible,
  grafana: grafana,
  aws: amazonwebservices,
  'amazon web services': amazonwebservices,
  azure: azure,
  gcp: googlecloud,
  'google cloud': googlecloud,

  // Mobile
  android: android,
  ios: apple,
  flutter: flutter,

  // Tooling & QA
  maven: maven,
  gradle: gradle,
  junit: junit,
  jest: jest,
  selenium: selenium,
  figma: figma,
  jira: jira,
}

/** Lower-cased and whitespace-collapsed, so catalog spelling drift still matches. */
export function normalizeSkillKey(skillName: string): string {
  return skillName.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** The logo for a skill, or null when it has none — the caller draws a letter instead. */
export function logoForSkill(skillName: string): string | null {
  return LOGO_BY_SKILL[normalizeSkillKey(skillName)] ?? null
}

/** First character, for the fallback disc. Uppercased; empty names give a dot. */
export function initialForSkill(skillName: string): string {
  const trimmed = skillName.trim()
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '·'
}
