// Draws the GOMORE wordmark (Didot capitals, widely spaced, like the GM logo's
// Didone letters) into a PNG, the source of the phone opening's stars.
//
// Run: swift scripts/render-gomore.swift scripts/gomore.png
// Then: node scripts/sample-gomore.mjs

import AppKit

let output = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "scripts/gomore.png")
guard let font = NSFont(name: "Didot", size: 360) else { fatalError("Didot is not installed") }
let word = NSAttributedString(string: "GOMORE", attributes: [
  .font: font,
  .foregroundColor: NSColor.white,
  .kern: 0.14 * 360,
])
let margin = 60
let size = word.size()
guard let canvas = NSBitmapImageRep(
  bitmapDataPlanes: nil, pixelsWide: Int(size.width) + margin * 2, pixelsHigh: Int(size.height) + margin * 2,
  bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
  colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { fatalError("no canvas") }
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: canvas)
word.draw(at: NSPoint(x: margin, y: margin))
NSGraphicsContext.restoreGraphicsState()
guard let png = canvas.representation(using: .png, properties: [:]) else { fatalError("no png") }
try png.write(to: output)
print("\(output.path): \(canvas.pixelsWide) × \(canvas.pixelsHigh)")
