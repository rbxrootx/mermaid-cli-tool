#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');
const puppeteer = require('puppeteer');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const figlet = require('figlet');

// Display cool ASCII art banner
console.log(
  chalk.cyan(
    figlet.textSync('MermaidTools', {
      font: 'Standard',
      horizontalLayout: 'default',
      width: 80
    })
  )
);
console.log(chalk.blue('✨ The ultimate Mermaid diagram generator ✨\n'));

// Setup CLI options
program
  .name('mermaidtools')
  .description('CLI tool to convert .mermaid files to various formats')
  .version('1.0.0');

program
  .argument('[input]', 'Input .mermaid file or directory')
  .argument('[output]', 'Output file (will override format from options)')
  .option('-o, --output <directory>', 'Output directory', process.cwd())
  .option('-f, --format <format>', 'Output format (pdf, png, svg)', 'png')
  .option('-t, --theme <theme>', 'Mermaid theme (default, forest, dark, neutral)', 'default')
  .option('-w, --width <width>', 'Output width in pixels', '800')
  .option('-h, --height <height>', 'Output height in pixels', '600')
  .option('-b, --background <color>', 'Background color (CSS color)', '#ffffff')
  .option('-r, --recursive', 'Process directories recursively', false)
  .option('-c, --config <file>', 'Path to config file (JSON)')
  .option('-i, --interactive', 'Run in interactive mode')
  .option('-p, --padding <padding>', 'Padding around diagram in pixels', '20')
  .option('-q, --quality <quality>', 'Output quality (1-3)', '2')
  .option('-s, --scale <scale>', 'Scale factor for the diagram', '1.0')
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--template <template>', 'Use a predefined template (flowchart, sequence, class, er, gantt, git)', '')
  .action(async (input, output, options) => {
    try {
      // Check if interactive mode is enabled
      if (options.interactive) {
        await runInteractiveMode(options);
        return;
      }
      
      // If no input is provided, show help
      if (!input) {
        program.help();
        return;
      }

      // Handle output file if provided as second argument
      if (output) {
        const outputExt = path.extname(output).toLowerCase().substring(1);
        if (['png', 'svg', 'pdf'].includes(outputExt)) {
          options.format = outputExt;
          options.outputFilename = path.basename(output);
          options.output = path.dirname(output);
          
          // Create output directory if it doesn't exist
          if (!fs.existsSync(options.output)) {
            fs.mkdirSync(options.output, { recursive: true });
          }
        } else {
          console.warn(chalk.yellow(`Warning: Unsupported output format in "${output}". Using format: ${options.format}`));
        }
      }

      // Load config file if provided
      if (options.config) {
        try {
          const configPath = path.resolve(options.config);
          if (fs.existsSync(configPath)) {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            options = { ...options, ...configData };
            if (options.verbose) {
              console.log(chalk.blue('Loaded configuration from:'), chalk.yellow(configPath));
            }
          } else {
            console.warn(chalk.yellow(`Config file not found: ${configPath}`));
          }
        } catch (error) {
          console.warn(chalk.yellow(`Error loading config file: ${error.message}`));
        }
      }

      // Check if input exists
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`Error: Input "${input}" does not exist`));
        process.exit(1);
      }

      // Create output directory if it doesn't exist
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
        if (options.verbose) {
          console.log(chalk.green(`Created output directory: ${options.output}`));
        }
      }

      // Process input
      const stats = fs.statSync(input);
      const spinner = ora('Processing diagrams...').start();
      
      if (stats.isFile()) {
        await processFile(input, options);
      } else if (stats.isDirectory()) {
        await processDirectory(input, options);
      }

      spinner.succeed(chalk.green('Conversion completed successfully!'));
      
      // Display summary
      if (options.verbose) {
        console.log(
          boxen(
            chalk.green('Conversion Summary\n') + 
            chalk.white(`Format: ${options.format}\n`) +
            chalk.white(`Theme: ${options.theme}\n`) +
            chalk.white(`Output: ${path.resolve(options.output)}`), 
            { 
              padding: 1, 
              borderColor: 'green', 
              margin: 1,
              borderStyle: 'round'
            }
          )
        );
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Add template command
program
  .command('template <templateName>')
  .description('Create a new diagram from a template')
  .option('-o, --output <file>', 'Output file path', './diagram.mermaid')
  .action((templateName, options) => {
    const templates = {
      flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,
      
      sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
      
      class: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }`,
      
      er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
      
      gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
      
      git: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`
    };

    if (!templates[templateName]) {
      console.error(chalk.red(`Error: Template "${templateName}" not found`));
      console.log(chalk.blue('Available templates:'), Object.keys(templates).join(', '));
      process.exit(1);
    }

    try {
      fs.writeFileSync(options.output, templates[templateName]);
      console.log(chalk.green(`Template "${templateName}" created at ${options.output}`));
    } catch (error) {
      console.error(chalk.red('Error creating template:'), error.message);
      process.exit(1);
    }
  });

/**
 * Run interactive mode
 */
async function runInteractiveMode(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.cyan('=== Interactive Mode ==='));
  console.log(chalk.yellow('Enter your Mermaid diagram code (type "END" on a new line when finished):'));
  
  let diagramCode = '';
  let line = '';
  
  while (true) {
    line = await new Promise(resolve => rl.question('> ', resolve));
    
    if (line.trim() === 'END') {
      break;
    }
    
    diagramCode += line + '\n';
  }
  
  if (!diagramCode.trim()) {
    console.log(chalk.red('No diagram code provided. Exiting.'));
    rl.close();
    return;
  }
  
  // Ask for output format
  const format = await new Promise(resolve => 
    rl.question(chalk.blue('Output format (pdf, png, svg) [png]: '), answer => 
      resolve(answer.trim() || 'png')
    )
  );
  
  // Ask for output file
  const outputFile = await new Promise(resolve => 
    rl.question(chalk.blue('Output file [diagram.' + format + ']: '), answer => 
      resolve(answer.trim() || 'diagram.' + format)
    )
  );
  
  // Ask for theme
  const theme = await new Promise(resolve => 
    rl.question(chalk.blue('Theme (default, forest, dark, neutral) [default]: '), answer => 
      resolve(answer.trim() || 'default')
    )
  );
  
  rl.close();
  
  // Create temp file
  const tempFile = path.join(os.tmpdir(), `mermaid_${Date.now()}.mermaid`);
  fs.writeFileSync(tempFile, diagramCode);
  
  // Process the diagram
  const spinner = ora('Generating diagram...').start();
  
  try {
    await processFile(tempFile, {
      ...options,
      format,
      theme,
      output: path.dirname(outputFile),
      outputFilename: path.basename(outputFile)
    });
    
    spinner.succeed(chalk.green('Diagram generated successfully!'));
    console.log(chalk.green(`Output saved to: ${outputFile}`));
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
  } catch (error) {
    spinner.fail(chalk.red('Error generating diagram'));
    console.error(error.message);
    
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Process a directory containing .mermaid files
 */
async function processDirectory(dirPath, options) {
  const files = fs.readdirSync(dirPath);
  let processedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && path.extname(filePath) === '.mermaid') {
      await processFile(filePath, options);
      processedCount++;
    } else if (stats.isDirectory() && options.recursive) {
      const subDirProcessed = await processDirectory(filePath, options);
      processedCount += subDirProcessed;
    }
  }
  
  if (options.verbose) {
    console.log(chalk.blue(`Processed ${processedCount} files in ${dirPath}`));
  }
  
  return processedCount;
}

/**
 * Process a single .mermaid file
 */
async function processFile(filePath, options) {
  if (path.extname(filePath) !== '.mermaid') {
    if (options.verbose) {
      console.warn(chalk.yellow(`Skipping non-mermaid file: ${filePath}`));
    }
    return;
  }

  try {
    const filename = options.outputFilename || path.basename(filePath, '.mermaid');
    const outputPath = path.join(options.output, `${filename}.${options.format}`);
    
    // Read diagram content and properly handle newlines
    let diagram = fs.readFileSync(filePath, 'utf8');
    
    // Ensure proper newline handling
    diagram = diagram.replace(/\\n/g, '\n');
    
    if (options.verbose) {
      console.log(chalk.blue(`Converting ${filePath} to ${outputPath}`));
    }
    
    await renderDiagram(diagram, outputPath, options);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error processing ${filePath}: ${error.message}`));
    return false;
  }
}

/**
 * Render mermaid diagram to the specified format
 */
async function renderDiagram(diagram, outputPath, options) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport with higher resolution for better quality
    await page.setViewport({
      width: parseInt(options.width),
      height: parseInt(options.height),
      deviceScaleFactor: parseInt(options.quality) || 2,
    });
    
    // Create HTML with mermaid diagram
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <style>
            body { 
              background-color: ${options.background}; 
              margin: 0; 
              padding: ${options.padding || 20}px;
              box-sizing: border-box;
            }
            #container { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
            }
            .mermaid {
              font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
              max-width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div class="mermaid">
${diagram}
            </div>
          </div>
          <script>
            mermaid.initialize({
              theme: '${options.theme}',
              startOnLoad: true,
              securityLevel: 'loose',
              fontFamily: 'Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif',
              logLevel: 5,
              flowchart: {
                htmlLabels: true,
                curve: 'basis'
              },
              sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35
              },
              gantt: {
                titleTopMargin: 25,
                barHeight: 20,
                barGap: 4,
                topPadding: 50,
                sidePadding: 75
              }
            });
          </script>
        </body>
      </html>
    `;
    
    await page.setContent(html);
    
    // Wait for mermaid to render with a longer timeout
    try {
      await page.waitForSelector('.mermaid svg', { timeout: 10000 });
    } catch (error) {
      // Check for error messages
      const errorMessages = await page.evaluate(() => {
        const errorDivs = document.querySelectorAll('.mermaid error-icon');
        if (errorDivs.length > 0) {
          return Array.from(errorDivs).map(div => div.textContent).join('\n');
        }
        return null;
      });
      
      if (errorMessages) {
        throw new Error(`Mermaid syntax error: ${errorMessages}`);
      } else {
        throw new Error('Timeout waiting for diagram to render. Check your diagram syntax.');
      }
    }
    
    // Apply scaling if needed
    if (options.scale && options.scale !== '1.0') {
      await page.evaluate((scale) => {
        const svg = document.querySelector('.mermaid svg');
        if (svg) {
          svg.style.transform = `scale(${scale})`;
          svg.style.transformOrigin = 'center center';
        }
      }, options.scale);
    }
    
    // Get SVG element
    const svgElement = await page.$('.mermaid svg');
    
    if (!svgElement) {
      throw new Error('Failed to render diagram. SVG element not found.');
    }
    
    // Handle different output formats
    switch (options.format) {
      case 'svg':
        const svgContent = await page.evaluate(el => {
          // Ensure SVG has proper XML declaration and namespaces
          const svgText = el.outerHTML;
          return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
                 svgText.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ');
        }, svgElement);
        fs.writeFileSync(outputPath, svgContent);
        break;
        
      case 'png':
        const pngBuffer = await svgElement.screenshot({
          omitBackground: options.background === 'transparent',
          type: 'png'
        });
        fs.writeFileSync(outputPath, pngBuffer);
        break;
        
      case 'pdf':
        await page.pdf({
          path: outputPath,
          printBackground: true,
          width: parseInt(options.width) + 'px',
          height: parseInt(options.height) + 'px',
          margin: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px'
          }
        });
        break;
        
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } finally {
    await browser.close();
  }
}

// Execute the program
program.parse(process.argv);