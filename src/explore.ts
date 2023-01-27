import { NestFactory } from '@nestjs/core'
import { writeFileSync } from 'fs'
import { SpelunkerModule } from 'nestjs-spelunker'
import { AppModule } from './app.module'

;(async () => {
  const app = await NestFactory.create(AppModule)
  const tree = SpelunkerModule.explore(app)
  const root = SpelunkerModule.graph(tree)
  const edges = SpelunkerModule.findGraphEdges(root)
  const mermaidEdges = edges.map(({ from, to }) => `\t${from.module.name}-->${to.module.name}`)
  writeFileSync(__dirname + '/../GRAPH.md', ['```mermaid', 'graph LR', ...mermaidEdges, '```'].join('\n'))
})()
