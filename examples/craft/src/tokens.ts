/** @since 0.4.0 */

import {Token} from "whuiy";

/** Content: the only token whose value is projected as text. */
export const Text = Token("Text").content<string>();

// The page.
/** @since 0.4.0 */
export const Theme = Token("Theme").single<string>();
/** @since 0.4.0 */
export const Craft = Token("Craft")();
/** @since 0.4.0 */
export const Body = Token("Body")();
/** @since 0.4.0 */
export const Top = Token("Top")();
/** @since 0.4.0 */
export const ThemeSwitch = Token("ThemeSwitch")();
/** @since 0.4.0 */
export const Gallery = Token("Gallery")();

// Facts the tips read.
/** @since 0.4.0 */
export const Hovered = Token("Hovered").single<boolean>();
/** @since 0.4.0 */
export const Pressed = Token("Pressed").single<boolean>();
/** @since 0.4.0 */
export const Moved = Token("Moved").single<boolean>();
/** @since 0.4.0 */
export const Smooth = Token("Smooth").single<boolean>();
/** @since 0.4.0 */
export const MoreAbove = Token("MoreAbove").single<boolean>();
/** @since 0.4.0 */
export const MoreBelow = Token("MoreBelow").single<boolean>();
/** @since 0.4.0 */
export const Reading = Token("Reading").single<number>();
/** @since 0.4.0 */
export const Steady = Token("Steady").single<boolean>();
/** @since 0.4.0 */
export const ReadingText = Token("ReadingText").content<string>();
/** @since 0.4.0 */
export const Size = Token("Size").single<number>();
/** @since 0.4.0 */
export const Glyph = Token("Glyph").single<string>();

// Each marker wraps the element its rule styles, so the rule knows the tag.
/** @since 0.4.0 */
export const NestedBox = Token("NestedBox")();
/** @since 0.4.0 */
export const Outer = Token("Outer").single<number>();
/** @since 0.4.0 */
export const Padding = Token("Padding").single<number>();
/** @since 0.4.0 */
export const InnerBox = Token("InnerBox")();
/** @since 0.4.0 */
export const Metric = Token("Metric")();
/** @since 0.4.0 */
export const AdvanceStep = Token("AdvanceStep")();
/** @since 0.4.0 */
export const Tightened = Token("Tightened")();
/** @since 0.4.0 */
export const Balanced = Token("Balanced")();
/** @since 0.4.0 */
export const Optical = Token("Optical")();
/** @since 0.4.0 */
export const Framed = Token("Framed")();
/** @since 0.4.0 */
export const Edged = Token("Edged")();
/** @since 0.4.0 */
export const Target = Token("Target")();
/** @since 0.4.0 */
export const Tinted = Token("Tinted")();
/** @since 0.4.0 */
export const HoverProbe = Token("HoverProbe")();
/** @since 0.4.0 */
export const Pressable = Token("Pressable")();
/** @since 0.4.0 */
export const PressProbe = Token("PressProbe")();
/** @since 0.4.0 */
export const Faded = Token("Faded")();
/** @since 0.4.0 */
export const ScrollProbe = Token("ScrollProbe")();
/** @since 0.4.0 */
export const Sliding = Token("Sliding")();
/** @since 0.4.0 */
export const Mover = Token("Mover")();
/** @since 0.4.0 */
export const Step = Token("Step")();
