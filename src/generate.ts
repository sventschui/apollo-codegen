import * as fs from 'fs';
import * as path from 'path';

import { loadSchema, loadSchemaFromConfig, loadAndMergeQueryDocuments } from './loading';
import { validateQueryDocument } from './validation';
import { compileToIR } from './compiler';
import { compileToLegacyIR } from './compiler/legacyIR';
import serializeToJSON from './serializeToJSON';
import { GeneratedFile } from './utilities/CodeGenerator'
import { generateSource as generateSwiftSource } from './swift';
import { generateSource as generateTypescriptSource } from './typescript';
import { generateSource as generateFlowSource } from './flow';
import { generateSource as generateFlowModernSource } from './flow-modern';
import { generateSource as generateScalaSource } from './scala';

export const TargetType = {
  json: 'json',
  swift: 'swift',
  ts: 'ts',
  typescript: 'typescript',
  flow: 'flow',
  'flow-modern': 'flow-modern',
  scala: 'scala'
};
export const TARGETS = Object.keys(TargetType);

export default function generate(
  inputPaths: string[],
  schemaPath: string,
  outputPath: string,
  only: string,
  target: keyof TargetType,
  tagName: string,
  projectName: string,
  options: any
) {
  const schema = schemaPath == null
    ? loadSchemaFromConfig(projectName)
    : loadSchema(schemaPath);

  const document = loadAndMergeQueryDocuments(inputPaths, tagName);

  validateQueryDocument(schema, document);

  let output;
  if (target === 'swift') {
    options.addTypename = true;
    const context = compileToIR(schema, document, options);

    const outputIndividualFiles = fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory();

    const generator = generateSwiftSource(context, outputIndividualFiles, only);

    if (outputIndividualFiles) {
      writeGeneratedFiles(generator.generatedFiles, outputPath);
    } else {
      fs.writeFileSync(outputPath, generator.output);
    }

    if (options.generateOperationIds) {
      writeOperationIdsMap(context);
    }
  } else if (target === 'flow-modern') {
    options.addTypename = true;
    const context = compileToIR(schema, document, options);
    output = generateFlowModernSource(context);
  } else {
    const context = compileToLegacyIR(schema, document, options);
    switch (target) {
      case 'json':
        output = serializeToJSON(context);
        break;
      case 'ts':
      case 'typescript':
        output = generateTypescriptSource(context);
        break;
      case 'flow':
        output = generateFlowSource(context);
        break;
      case 'scala':
        output = generateScalaSource(context, options);
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, output);
    } else {
      console.log(output);
    }
  }
}

function writeGeneratedFiles(generatedFiles: { [fileName: string]: GeneratedFile }, outputDirectory: string) {
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }
  for (const [fileName, generatedFile] of Object.entries(generatedFiles)) {
    fs.writeFileSync(path.join(outputDirectory, fileName), generatedFile.output);
  }
}

interface OperationIdsMap {
  name: string;
  source: string;
}

function writeOperationIdsMap(context: any) {
  let operationIdsMap: { [id: string]: OperationIdsMap } = {};
  Object.values(context.operations).forEach(operation => {
    operationIdsMap[operation.operationId] = {
      name: operation.operationName,
      source: operation.sourceWithFragments
    };
  });
  fs.writeFileSync(context.operationIdsPath, JSON.stringify(operationIdsMap, null, 2));
}
