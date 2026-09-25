import { Tag, TagProps } from 'antd';
import { memo } from 'react';

/** This edition's name. Redux has no release numbers of its own. */
export const EDITION = 'Redux';

const VersionTag = memo<TagProps>((props) => (
  <Tag color="success" {...props}>
    {EDITION}
  </Tag>
));

export default VersionTag;
