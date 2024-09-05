import { useEffect, useState } from 'react';
import { TiTick } from 'react-icons/ti';
import { IoCloseSharp } from 'react-icons/io5';
interface Props {
  password: string;
}

interface Criteria {
  [key: string]: (password: string) => boolean;
}

const PasswordChecker = ({ password }: Props) => {
  const criteria: Criteria = {
    'At least 6 characters long': (password: string) => password.length >= 6,
    'At least 1 uppercase letter': (password: string) => /[A-Z]/.test(password),
    'At least 1 lowercase letter': (password: string) => /[a-z]/.test(password),
    'At least 1 number': (password: string) => /[0-9]/.test(password),
    'At least 1 special character': (password: string) => /[^A-Za-z0-9]/.test(password),
  };

  const [passwordCriteria, setPasswordCriteria] = useState<Record<string, boolean>>(
    Object.keys(criteria).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
  );

  useEffect(() => {
    setPasswordCriteria(
      Object.keys(criteria).reduce(
        (acc, key) => ({
          ...acc,
          [key]: criteria[key](password),
        }),
        {},
      ),
    );
  }, [password]);

  return (
    <div className="my-[20px] w-full">
      {Object.entries(passwordCriteria).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div className="text-[14px]">{key}</div>
          <div className="mr-[20px]">
            {value ? <TiTick color="green" /> : <IoCloseSharp color="red" />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PasswordChecker;
